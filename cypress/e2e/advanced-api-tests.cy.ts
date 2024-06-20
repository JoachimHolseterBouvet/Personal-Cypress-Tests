/* 
API Testing of the "Notes" API from https://practice.expandtesting.com/.
This is just an example to show how API-testing can be done through Cypress.
Documentation can be found here: https://practice.expandtesting.com/notes/api/api-docs/.
To use some parts of the API, the user must be authorized via login. As far as I can tell this must be done via a UI interface. 
Created by Joachim Holseter, Bouvet SQAD, June 2024.
*/


describe("Test the Notes API with core functions", () => {
  beforeEach(() => {
    cy.visit("https://practice.expandtesting.com/notes/api/api-docs/")
  })

  context(
    "Create user, authenticate, create note, edit note, delete note and delete user",
    () => {

      //Define variables
      let username = "";
      let authToken = "";
      let profileID = 1;
      let noteID = 2;


      it("Check health of API", () => {
        // Intercept the health check API request
        cy.intercept("GET", "/notes/api/health-check").as(
          "notesHealthCheckRequest"
        )

        // Make the API request
        cy.request("/notes/api/health-check").then((response) => {
          // Assert status of the response
          expect(response.status).to.eq(200)
        })
      })

        // Make a POST request to login with invalid credentials
      it("Should return unauthorized for invalid login credentials", () => {
        cy.request({
          method: "POST",
          url: "/notes/api/users/login",
          body: {
            email: "invalid.user@example.com",
            password: "invalidpassword",
          },
          failOnStatusCode: false, // If we don't include this, Cypress will recognize code 401 as an error and stop the test.
        }).then((response) => {
          // Assert responses. Status 401 is "Unauthorized Request"
          expect(response.status).to.eq(401)
          expect(response.body).to.have.property("success", false)
          expect(response.body).to.have.property("status", 401)
          expect(response.body).to.have.property("message","Incorrect email address or password")
        })
      })

      // Create a valid user and check for successful status 201. To verify that we actually created a new user, we add 8 random digits to the end of the username.
      it("Create user and check for successful status 201", () => {
        const randomUsername =
          "valid.testuser" +
          Math.floor(Math.random() * 100000000)
            .toString()
            .padStart(8, "0") +
          "@gmail.com"
        cy.log("Created randomized username: " + randomUsername);
        username = randomUsername;

        // Make a POST request with the created username to register the user
        cy.request({
          method: "POST",
          url: "notes/api/users/register",
          body: {
            email: randomUsername,
            password: "validpassword",
            name: "Tom Testman",
          },
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body).to.have.property("status", 201)
          expect(response.body).to.have.property("message","User account created successfully")
          expect(response.body).to.have.property("data")
          expect(response.body.data).to.have.property("email", randomUsername)
          expect(response.body.data).to.have.property("name", "Tom Testman")
        })
      })

      // With the user registered, we can now log in
      it("Login with newly created user and authorize browser", () => {
        cy.request({
          method: "POST",
          url: "notes/api/users/login",
          body: {
            email: username,
            password: "validpassword",
          },
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property("success", true)
          expect(response.body).to.have.property("status", 200)
          expect(response.body).to.have.property("message", "Login successful")
          expect(response.body).to.have.property("data")
          expect(response.body.data).to.have.property("token")
          authToken = response.body.data.token
          cy.log(authToken)

          // Authorize the browser via the GUI
          cy.get('button[class="btn authorize unlocked"]').should("be.visible").click()
          cy.get('input[id="api_key_value"]').focus().type(authToken)
          cy.get('button[class="btn modal-btn auth authorize button"]').should("be.visible").click()
          cy.get('button[class="btn modal-btn auth btn-done button"]').should("be.visible").click()

          // Request with the x-auth-token in header to check authorization
          cy.request({
            method: "GET",
            url: "notes/api/users/profile",
            headers: {
              "x-auth-token": authToken,
            },
          }).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body).to.have.property("success", true)
            expect(response.body).to.have.property("status", 200)
            expect(response.body).to.have.property("message","Profile successful")
            expect(response.body.data).to.have.property("email", username)
          })
        })
      })

      // Now that we are authorized, we can use "locked" functions like getting the user's profile information
      // We first check that the newly created user does not have properties like "company" and "phone number", this will be added later via PATCH.
      it("Get current profile information before changing it", () => {
        cy.request({
          method: "GET",
          url: "notes/api/users/profile",
          headers: {
            "x-auth-token": authToken, // Include the token in the x-auth-token header
          },
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property("success", true)
          expect(response.body).to.have.property("status", 200)
          expect(response.body).to.have.property("message","Profile successful")
          expect(response.body).to.have.property("data")
          expect(response.body.data).to.not.have.property("phone") // Assert that 'phone' property does not exist
          expect(response.body.data).to.not.have.property("company") // Assert that 'phone' property does not exist
          profileID = response.body.data.id
          cy.log("Profile ID: "+profileID.toString())
        })

        // PATCH request to update the user information
        const updatedInfo = {
          name: "Tom Testman Updated",
          phone: "0123456789",
          company: "BOUVET ASA",
        }

        cy.request({
          method: "PATCH",
          url: "notes/api/users/profile",
          headers: {
            "x-auth-token": authToken,
          },
          body: updatedInfo,
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property("success", true)
          expect(response.body).to.have.property("status", 200)
          expect(response.body).to.have.property("message","Profile updated successful")
          expect(response.body).to.have.property("data")
          expect(response.body.data).to.have.property("name", updatedInfo.name)
          expect(response.body.data).to.have.property("phone",updatedInfo.phone) // Assert that phone number and company now exists, validating our changes.
          expect(response.body.data).to.have.property("company",updatedInfo.company)

          // Get updated profile information to validate the changes
          cy.request({
            method: "GET",
            url: "notes/api/users/profile",
            headers: {
              "x-auth-token": authToken,
            },
          }).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body).to.have.property("success", true)
            expect(response.body).to.have.property("status", 200)
            expect(response.body).to.have.property("message","Profile successful")
            expect(response.body).to.have.property("data")
            expect(response.body.data).to.have.property("name",updatedInfo.name)
            expect(response.body.data).to.have.property("phone",updatedInfo.phone)
            expect(response.body.data).to.have.property("company",updatedInfo.company)
            expect(profileID).to.equal(response.body.data.id)
            // Log the user information
            cy.log("User's name is: " + response.body.data.name)
            cy.log("User's email is: " + response.body.data.email)
            cy.log("User's phone is: " + response.body.data.phone)
            cy.log("User's company is: " + response.body.data.company)
            cy.log("User's ID is: " + response.body.data.id)
          })
        })
      })

      // Posting a new note through the API
      it("Post a new note through the API", () => {
        const newNote = {
          title: "Test note added through API",
          description: "This a a useless note that takes space up on someone's server :-)",
          category: "Work",
        }

        cy.request({
          method: "POST",
          url: "notes/api/notes",
          headers: {"x-auth-token": authToken},
          body: newNote,
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property("success", true)
          expect(response.body).to.have.property("status", 200)
          expect(response.body).to.have.property("data")
          expect(response.body.data).to.have.property("title", newNote.title) // Assert that the response has the same title, category and description that we assigned earlier
          expect(response.body.data).to.have.property("description",newNote.description)
          expect(response.body.data).to.have.property("category",newNote.category)
          // Log the note's content
          cy.log("Note was added with ID: " + response.body.data.id + " in category " + response.body.data.category)
          cy.log("Note has title: " + response.body.data.title)
          cy.log("Note was description: " + response.body.data.description)
          noteID = response.body.data.id
        })
      })

      // PATCH the note to update it's status to "Completed"
      it('Edit the note and set its status to "completed"', () => {
        const updatedNote = {
          completed: true,
        }

        cy.request({
          method: "PATCH",
          url: `notes/api/notes/${noteID}`,
          headers: {
            "x-auth-token": authToken,
          },
          body: updatedNote,
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property("success", true)
          expect(response.body).to.have.property("status", 200)
          expect(response.body).to.have.property(
            "message",
            "Note successfully Updated"
          )
          expect(response.body).to.have.property("data")
          expect(response.body.data).to.have.property("completed", true)
        })
      })

      // After updating the note and validating its changes with assertions, we can now delete the note
      it("Delete the note we created", () => {
        cy.request({
          method: "DELETE",
          url: `notes/api/notes/${noteID}`,
          headers: {
            "x-auth-token": authToken,
          },
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property("success", true)
          expect(response.body).to.have.property("status", 200)
          expect(response.body).to.have.property("message","Note successfully deleted")
        })
      })


      // After having deleted the note, we can now delete the user account
      it("Delete user we are signed in as", () => {
        cy.request({
          method: "DELETE",
          url: `notes/api/users/delete-account`,
          headers: {
            "x-auth-token": authToken,
          },
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property("success", true)
          expect(response.body).to.have.property("status", 200)
          expect(response.body).to.have.property("message","Account successfully deleted")
        })
      })
    }
  )
})