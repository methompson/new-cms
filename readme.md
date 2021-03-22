User Routes:

POST /login
Logs a user in
body values:
username - string
password - string

GET /id
Gets information about a user by their id
body values:
id - string

GET /username
Gets information about a user by their username
body values:
username - string

POST /add
Adds a user to the database
body values:
username - string
email - string
password - string
firstName - string
lastName - string
userType - string

POST /edit
Edits a user

POST /delete
Deletes a user

Blog Routes:

GET /id
Gets a blog by id
body values:
id - string

GET /slug
Gets a blog by slug
slug - string

POST /add
Adds a blog post

POST /edit
Updates a blog post

POST /delete
Deletes a blog post