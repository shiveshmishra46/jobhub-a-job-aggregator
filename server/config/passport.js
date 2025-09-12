// Ensure env vars are available even if server forgot to call dotenv
import 'dotenv/config';

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

// Defer strategy setup until after env is loaded
export function configurePassport() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth disabled: missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment.');
    return; // Do not crash server; manual auth will still work
  }

  console.log('Google OAuth enabled. Callback:', GOOGLE_CALLBACK_URL || '/api/auth/google/callback');

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
        // Optionally force newer endpoint:
        // userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Try find by googleId
          let user = await User.findOne({ googleId: profile.id });
          if (user) {
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }

          // Try find by email to link existing account
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              user.isEmailVerified = true;
              user.lastLogin = new Date();
              await user.save();
              return done(null, user);
            }
          }

          // Create a new user
          user = new User({
            googleId: profile.id,
            name: profile.displayName || 'Google User',
            email,
            role: 'student',
            isEmailVerified: true,
            lastLogin: new Date(),
            profile: {
              profilePicture: profile.photos?.[0]
                ? { filename: 'google-profile-pic', contentType: 'image/jpeg' }
                : undefined
            }
          });

          await user.save();
          return done(null, user);
        } catch (error) {
          console.error('Google strategy error:', error);
          return done(error, null);
        }
      }
    )
  );
}

// Sessions not used but harmless to keep
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;