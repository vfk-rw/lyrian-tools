import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import type { NextAuthOptions } from "next-auth";

const DISCORD_GUILD_ID = process.env.DISCORD_SERVER_ID;

// Move authOptions to its own file for sharing
import { authOptions } from './authOptions';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };