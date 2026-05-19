import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "./mongodb";
import User from "./models/User";

const DEFAULT_ADMIN_EMAIL = "jhonrique@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "Rick0066@#0066";
const DEFAULT_ADMIN_NAME = "Jhon Rique";
const DEFAULT_ADMIN_LASTNAME = "Chito Ruiz";

export const { handlers, signIn, signOut, auth } = NextAuth({
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

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            return null;
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
