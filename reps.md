a personal training assistant app

it should work on all modern mobile devices and take advantage of the size of the viewport to make the actions as visible and easy to tap as possible, as it may be used in a situation where hitting something quickly will be advantageous (quickly logging a set and adding notes while not interrupting the workout), the ui should be spartan and accessible, it should automatically switch the ui theme (light/dark) based on the system preference.

i want to deploy this as a vercel web app with a postgres database in supabase. users should log in with whatever authentication is most easily supported by these platforms, magic link is fine to email or sms, no need to store passwords. you'll need to walk me through the setup process there. if possible, i'd like the database schema to be stored in code. we may add some migration tools later but let's just tweak the initial schema as we refine the app during this prototype stage.

when a user is authenticated they will be prompted with a view to design a new session, each session consists of "supersets" where each superset is a list of exercises. a "superset" may have a single exercise

an exercise has a name, a description, a link to a video demonstration, and a list of possible modifications - some examples of modifications: "+ twist", "defecit (with associated height of defecit)", etc.

after a session has been designed, it can be used. when a user performs a session, they should see the exercise they are supposed to do and be prompted to log a "set" - it has a foreign key to the exercise and stores the datetime, weight used, number of repetitions, and notes - all fields optional. there will be a button to advance to the next exercise (or next set if the superset has only a single exercise) or to complete the superset and move on to the next one.

users may only edit their own exercises and associated data, some users will have a staff role that allows them to add/edit exercises

users may view their previous sessions.
