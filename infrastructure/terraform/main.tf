terraform {
  required_version = ">= 1.6.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }
}

provider "kubernetes" {
  config_path    = pathexpand(var.kubeconfig_path)
  config_context = var.kube_context != "" ? var.kube_context : null
}

resource "kubernetes_namespace_v1" "tochi" {
  metadata {
    name = var.namespace
  }
}

resource "kubernetes_config_map_v1" "app" {
  metadata {
    name      = "${var.app_name}-config"
    namespace = kubernetes_namespace_v1.tochi.metadata[0].name
  }

  data = {
    NODE_ENV                = "production"
    NEXT_TELEMETRY_DISABLED = "1"
    NEXT_PUBLIC_APP_NAME    = var.app_name
    NEXT_PUBLIC_APP_URL     = var.public_app_url
    AUTH_URL                = var.nextauth_url
    NEXTAUTH_URL            = var.nextauth_url
  }
}

resource "kubernetes_secret_v1" "app" {
  metadata {
    name      = "${var.app_name}-secrets"
    namespace = kubernetes_namespace_v1.tochi.metadata[0].name
  }

  type = "Opaque"

  data = {
    MONGODB_URI     = base64encode(var.mongodb_uri)
    AUTH_SECRET     = base64encode(var.auth_secret)
    NEXTAUTH_SECRET = base64encode(var.auth_secret)
    OPENAI_API_KEY = base64encode(var.openai_api_key)
  }
}

resource "kubernetes_deployment_v1" "app" {
  metadata {
    name      = var.app_name
    namespace = kubernetes_namespace_v1.tochi.metadata[0].name
    labels = {
      app = var.app_name
    }
  }

  spec {
    replicas = var.replicas

    selector {
      match_labels = {
        app = var.app_name
      }
    }

    template {
      metadata {
        labels = {
          app = var.app_name
        }
      }

      spec {
        container {
          name  = "web"
          image = var.image

          port {
            container_port = 3000
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map_v1.app.metadata[0].name
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret_v1.app.metadata[0].name
            }
          }

          readiness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }

          liveness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 20
            period_seconds        = 20
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }
        }
      }
    }
  }
}

resource "kubernetes_service_v1" "app" {
  metadata {
    name      = var.app_name
    namespace = kubernetes_namespace_v1.tochi.metadata[0].name
  }

  spec {
    selector = {
      app = var.app_name
    }

    port {
      port        = 80
      target_port = 3000
    }

    type = "ClusterIP"
  }
}

resource "kubernetes_ingress_v1" "app" {
  metadata {
    name      = var.app_name
    namespace = kubernetes_namespace_v1.tochi.metadata[0].name
  }

  spec {
    ingress_class_name = var.ingress_class_name

    tls {
      hosts       = [var.host]
      secret_name = var.tls_secret_name
    }

    rule {
      host = var.host
      http {
        path {
          path      = "/"
          path_type = "Prefix"
          backend {
            service {
              name = kubernetes_service_v1.app.metadata[0].name
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }
}
