variable "kubeconfig_path" {
  type        = string
  description = "Ruta al kubeconfig local."
  default     = "~/.kube/config"
}

variable "kube_context" {
  type        = string
  description = "Contexto de Kubernetes a usar."
  default     = ""
}

variable "namespace" {
  type        = string
  description = "Namespace donde se desplegara TOCHI."
  default     = "tochi-legal-suite"
}

variable "app_name" {
  type        = string
  description = "Nombre de la app y recursos asociados."
  default     = "tochi-legal-suite"
}

variable "image" {
  type        = string
  description = "Imagen de contenedor para el despliegue."
}

variable "replicas" {
  type        = number
  description = "Numero de replicas del deployment."
  default     = 2
}

variable "host" {
  type        = string
  description = "Dominio publico para el ingreso."
  default     = "tochi.example.com"
}

variable "tls_secret_name" {
  type        = string
  description = "Nombre del secreto TLS del ingreso."
  default     = "tochi-legal-suite-tls"
}

variable "ingress_class_name" {
  type        = string
  description = "Clase de ingreso del cluster."
  default     = "nginx"
}

variable "public_app_url" {
  type        = string
  description = "URL publica de la aplicacion."
  default     = "https://tochi.example.com"
}

variable "mongodb_uri" {
  type        = string
  description = "Cadena de conexion a MongoDB."
  sensitive   = true
}

variable "nextauth_url" {
  type        = string
  description = "URL publica usada por NextAuth."
}

variable "nextauth_secret" {
  type        = string
  description = "Secreto de NextAuth."
  sensitive   = true
}

variable "openai_api_key" {
  type        = string
  description = "API key para OpenAI."
  sensitive   = true
}
