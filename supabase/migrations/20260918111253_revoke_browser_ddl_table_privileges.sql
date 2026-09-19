-- Browser roles never need schema-changing or whole-table privileges.
-- Keep ordinary DML grants unchanged; remove only privileges that are outside
-- the application's Data API contract.

revoke truncate, references, trigger
on all tables in schema public
from anon, authenticated;
