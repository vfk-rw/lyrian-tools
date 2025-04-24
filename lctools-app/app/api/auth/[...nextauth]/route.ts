import NextAuth from "next-auth";

// Move authOptions to its own file for sharing
import { authOptions } from './authOptions';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };