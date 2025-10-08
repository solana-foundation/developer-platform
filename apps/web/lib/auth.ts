import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { loginUser, refreshAccessToken } from '@/lib/api/auth';

async function refreshToken(token: JWT): Promise<JWT> {
  try {
    const response = await refreshAccessToken(token.refreshToken as string);

    return {
      ...token,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          const data = await loginUser({
            email: credentials.email,
            password: credentials.password,
          });

          if (data.user && data.accessToken) {
            return {
              id: data.user.id,
              email: data.user.email,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            };
          }

          return null;
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error('Authentication failed');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user && user.accessToken && user.refreshToken) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          id: user.id,
          accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour
        };
      }

      // Return previous token if the access token has not expired yet
      if (
        token.accessTokenExpires &&
        Date.now() < (token.accessTokenExpires as number)
      ) {
        return token;
      }

      // Access token has expired, try to refresh it
      return refreshToken(token);
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.error = token.error as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days (matches refresh token expiry)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
