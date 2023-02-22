const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const { ExtractJwt } = require("passport-jwt");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const Entities = require("html-entities").AllHtmlEntities;
const entities = new Entities();
const Config = require("./configuration/config");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(Config.cryptR.secret);
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// const shadowCryptr = new Cryptr(Config.cryptR.new_secret);

const Adm = require("./models/adm");
const userModel = require("./models/user");
const partnerModel = require("./models/partner");

var BasicStrategy = require("passport-http").BasicStrategy;

isValidPassword = async function (newPassword, existingPassword) {
  try {
    return await bcrypt.compare(newPassword, existingPassword);
  } catch (error) {
    throw new Error(error);
  }
};

isValidUserName = async function (newUserName, existingUserName) {
  try {
    return await bcrypt.compare(newUserName, existingUserName);
  } catch (error) {
    throw new Error(error);
  }
};

//ok
passport.use(
  "localAdm",
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await Adm.findByUsername(entities.encode(username));
      if (user.length > 0) {
        const isMatch = await isValidPassword(password, user[0].password);
        if (!isMatch) {
          return done(null, { id: 0 });
        }
        done(null, user[0]);
      } else {
        return done(null, { id: 0 });
      }
    } catch (error) {
      done(error, false);
    }
  })
);
//ok
passport.use(
  "jwtAdm",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Config.jwt.secret,
    },
    async (payload, done) => {
      try {
        if (!payload.admin_type) {
          return done(null, { id: 0 });
        }
        if (!payload.sub) {
          return done(null, { id: 0 });
        }
        if (!payload.ag) {
          return done(null, { id: 0 });
        }
        if (payload.is_admin != 1) {
          return done(null, { id: 0 });
        }
        if (!payload.exp) {
          return done(null, { id: 0 });
        } else {
          var current_time = Math.round(new Date().getTime() / 1000);
          if (current_time > payload.exp) {
            return done(null, { id: 0 });
          }
        }

        const user = await Adm.findByAdminId(cryptr.decrypt(payload.sub));

        if (user.length > 0) {
          const data_obj = {
            user_id: user[0].id,
            email: user[0].email,
            first_name: user[0].first_name,
            last_name: user[0].last_name,
            name: payload.name,
            type: "A",
            admin_type: payload.admin_type,
            ag: cryptr.decrypt(payload.ag),
          };
          done(null, data_obj);
        } else {
          return done(null, { id: 0 });
        }
      } catch (error) {
        console.log(error);
        done(null, user[0]);
      }
    }
  )
);

passport.use(
  "localUser",
  new LocalStrategy(
    {
      usernameField: "email",
    },
    async (email, password, done) => {
      try {
        const user = await userModel.get_user_by_email(entities.encode(email));

        if (user.length > 0) {
          const isMatch = await isValidPassword(password, user[0].password);
          if (!isMatch) {
            return done(null, { id: 0 });
          }
          return done(null, user[0]);
        } else {
          return done(null, { id: 0 });
        }
      } catch (error) {
        done(error, false);
      }
    }
  )
);

passport.use(
  "localPartner",
  new LocalStrategy(
    {
      usernameField: "email",
    },
    async (email, password, done) => {
      try {
        const user = await partnerModel.get_partner_by_email(
          entities.encode(email)
        );

        if (user.length > 0) {
          const isMatch = await isValidPassword(password, user[0].password);
          if (!isMatch) {
            return done(null, { id: 0 });
          }
          return done(null, user[0]);
        } else {
          return done(null, { id: 0 });
        }
      } catch (error) {
        done(error, false);
      }
    }
  )
);

//ok
passport.use(
  "jwtUser",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Config.jwt.secret,
    },
    async (payload, done) => {
      // console.log("this is agent :: ",!payload.ag);
      try {
        if (!payload.sub) {
          return done(null, { id: 0 });
        }
        if (!payload.user_type) {
          return done(null, { id: 0 });
        }

        if (!payload.ag) {
          return done(null, { id: 0 });
        }
        if (!payload.exp) {
          return done(null, { id: 0 });
        } else {
          var current_time = Math.round(new Date().getTime() / 1000);
          if (current_time > payload.exp) {
            return done(null, { id: 0 });
          }
        }

        const user = await userModel.findByUserId(cryptr.decrypt(payload.sub));

        if (user.length > 0) {
          user[0].ag = cryptr.decrypt(payload.ag);
          if (payload.user_type == "U") {
            done(null, user[0]);
          } else {
            return done(null, { id: 0 });
          }
        } else {
          return done(null, { id: 0 });
        }
      } catch (error) {
        done(null, user[0]);
      }
    }
  )
);

//ok
passport.use(
  "jwtPartner",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Config.jwt.secret,
    },
    async (payload, done) => {
      // console.log("this is agent :: ",!payload.ag);
      try {
        if (!payload.sub) {
          return done(null, { id: 0 });
        }
        if (!payload.user_type) {
          return done(null, { id: 0 });
        }

        if (!payload.ag) {
          return done(null, { id: 0 });
        }
        if (!payload.exp) {
          return done(null, { id: 0 });
        } else {
          var current_time = Math.round(new Date().getTime() / 1000);
          if (current_time > payload.exp) {
            return done(null, { id: 0 });
          }
        }

        const user = await partnerModel.findByPartnerId(
          cryptr.decrypt(payload.sub)
        );

        if (user.length > 0) {
          user[0].ag = cryptr.decrypt(payload.ag);
          if (payload.user_type == "P") {
            done(null, user[0]);
          } else {
            return done(null, { id: 0 });
          }
        } else {
          return done(null, { id: 0 });
        }
      } catch (error) {
        done(null, user[0]);
      }
    }
  )
);
// Save to session
passport.serializeUser(function (user, done) {
  // //console.log("user-p1",user);
  done(null, user);
});

// Restore from Session
passport.deserializeUser(function (user, done) {
  // User.findById(id, function(err, user) {
  // });
  // //console.log("user-p2",user);

  done(null, user);
});

passport.use(
  "jwtGoogle",
  new GoogleStrategy(
    {
      clientID:
        "710867649220-4tcse3pd9j0a0k9bcabft6vrak87j567.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: `${Config.website.backend_url}:${process.env.PORT}/api/partner/auth/google/callback/`,
    },
    function (accessToken, refreshToken, profile, done) {
      // User.findOrCreate({ googleId: profile.id }, function (err, user) {
      // });
      return done(null, profile);
    }
  )
);

/////////////xxxxxxxxxxxxxxxxxxxxxx
// passport.use(
// 	new GoogleStrategy(
// 		{
// 			clientID: "710867649220-4tcse3pd9j0a0k9bcabft6vrak87j567.apps.googleusercontent.com",
// 			clientSecret:"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",
// 			// callbackURL: "/auth/google/callback",
//       callbackURL:`${Config.website.backend_url}:${process.env.PORT}/api/partner/auth/google/callback/`,
// 			scope: ["profile", "email"],
// 		},
// 		function (accessToken, refreshToken, profile, callback) {
// 			callback(null, profile);
// 		}
// 	)
// );
