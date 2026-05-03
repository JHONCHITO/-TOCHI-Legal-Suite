import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "./mongodb";
import User from "./models/User";

const DEFAULT_ADMIN_EMAIL = (process.env.DEFAULT_ADMIN_EMAIL || "rick6683rick@gmail.com").toLowerCase();
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "123456";
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NOMBRE || "Ricky";
const DEFAULT_ADMIN_LASTNAME = process.env.DEFAULT_ADMIN_APELLIDO || "Tochi";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await dbConnect();

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);
        const user = await User.findOne({ 
          email
        });

        if (!user && email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
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

        if (!user || !user.activo) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid && email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
          const hashedPassword = await bcrypt.hash(password, 12);
          user.password = hashedPassword;
          user.rol = "superadmin";
          user.activo = true;
          user.emailVerified = new Date();
          await user.save();

          return {
            id: user._id.toString(),
            email: user.email,
            name: `${user.nombre} ${user.apellido}`,
            role: user.rol,
            image: user.avatar,
          };
        }

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
