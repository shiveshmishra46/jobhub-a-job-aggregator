// Ensure env vars are available even if server forgot to call dotenv
import 'dotenv/config';

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

// Defer strategy setup until after env is loaded
export function configurePassport() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn(
      'Google OAuth disabled: missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment.'
    );
    return; // Do not crash server; manual auth will still work
  }

  passport.use(new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        user = await User.findOne({ email: profile.emails?.[0]?.value });

        if (user) {
          user.googleId = profile.id;
          user.isEmailVerified = true;
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
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
        return done(error, null);
      }
    }
  ));
}

// If you aren’t using sessions, these won’t run; safe to keep.
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;