import dotenv from "dotenv";
import path from "path";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "./mongodb";
import User from "./models/User";
import { ensureSubscriptionForUser } from "./subscription";

const AUTH_COOKIE_DOMAIN = (process.env.AUTH_COOKIE_DOMAIN || "").trim();

const authEnvPaths = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", ".env.local"),
  path.resolve(process.cwd(), "..", ".env"),
  path.resolve(process.cwd(), "..", "..", ".env"),
];

for (const envPath of authEnvPaths) {
  dotenv.config({ path: envPath, override: false });
}

if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = "tochi_legal_suite_secret_2026";
}

if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
  process.env.AUTH_URL = "http://localhost:3000";
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}

const DEFAULT_ADMIN_EMAIL = "jhonrique1@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "Rick0066@#0066";
const DEFAULT_ADMIN_NAME = "Jhon Rique";
const DEFAULT_ADMIN_LASTNAME = "Chito Ruiz";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  cookies: AUTH_COOKIE_DOMAIN
    ? {
        sessionToken: {
          options: {
            domain: AUTH_COOKIE_DOMAIN,
            path: "/",
            sameSite: "lax",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
          },
        },
      }
    : undefined,
  debug: true,
  logger: {
    error(error) {
      console.error("[next-auth:error]", error);
    },
    warn(code) {
      console.warn("[next-auth:warn]", code);
    },
    debug(code, metadata) {
      console.log("[next-auth:debug]", code, metadata);
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          await dbConnect();

          const email = String(credentials.email).toLowerCase().trim();
          const password = String(credentials.password);
          const isBootstrapCredentials = email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD;
          const user = await User.findOne({
            email,
          });

          if (!user && isBootstrapCredentials) {
            const hashedPassword = await bcrypt.hash(password, 12);
            const bootstrapUser = await User.create({
              email,
              password: hashedPassword,
              nombre: DEFAULT_ADMIN_NAME,
              apellido: DEFAULT_ADMIN_LASTNAME,
              rol: "superadmin",
              activo: true,
              emailVerified: new Date(),
            });

            return {
              id: bootstrapUser._id.toString(),
              email: bootstrapUser.email,
              name: `${bootstrapUser.nombre} ${bootstrapUser.apellido}`,
              role: bootstrapUser.rol,
              image: bootstrapUser.avatar,
            };
          }

          if (isBootstrapCredentials && user) {
            let changed = false;

            if (!user.activo) {
              user.activo = true;
              changed = true;
            }

            if (user.rol !== "superadmin") {
              user.rol = "superadmin";
              changed = true;
            }

            const passwordMatches = typeof user.password === "string" && user.password.trim()
              ? await bcrypt.compare(password, user.password).catch(() => false)
              : false;

            if (!passwordMatches) {
              user.password = await bcrypt.hash(password, 12);
              changed = true;
            }

            if (changed) {
              user.emailVerified = user.emailVerified || new Date();
              await user.save();
            }

            return {
              id: user._id.toString(),
              email: user.email,
              name: `${user.nombre} ${user.apellido}`,
              role: "superadmin",
              image: user.avatar,
            };
          }

          if (!user || !user.activo) {
            return null;
          }

          let isPasswordValid = false;
          if (typeof user.password === "string" && user.password.trim()) {
            isPasswordValid = await bcrypt.compare(
              credentials.password as string,
              user.password
            );
          }

          if (!isPasswordValid) {
            return null;
          }

          if (user.rol !== "superadmin") {
            try {
              await ensureSubscriptionForUser(user._id.toString());
            } catch (subscriptionError) {
              console.warn(
                "No se pudo asegurar la suscripcion al iniciar sesion, se continua sin bloquear el acceso:",
                subscriptionError instanceof Error ? subscriptionError.message : subscriptionError
              );
            }
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: `${user.nombre} ${user.apellido}`,
            role: user.rol,
            image: user.avatar,
          };
        } catch (error) {
          console.error("Error autenticar credenciales:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

// Extend types
declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      image?: string;
    };
  }
}
