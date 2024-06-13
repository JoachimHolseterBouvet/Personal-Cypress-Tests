import { random } from "lodash"

// Define the debug mode boolean at the top level
const debugMode = false // Set to true for debug mode, false to disable

// Helper function for conditional wait
const debugWait = () => {
  if (debugMode) {
    cy.wait(500)
  }
}

describe("Test the Notes API with core functions", () => {
  beforeEach(() => {
    cy.visit("https://practice.expandtesting.com/notes/api/api-docs/")
  })

  context(
    "Create user, authenticate, create note, edit note, delete note and delete user",
    () => {
      it("Check health of API", () => {
        // Intercept the health check API request
        cy.intercept("GET", "/notes/api/health-check").as(
          "notesHealthCheckRequest"
        )

        // Make the API request directly
        cy.request("/notes/api/health-check").then((response) => {
          // Assert on the status and body of the response
          expect(response.status).to.eq(200)
        })
      })

      it("Should return unauthorized for invalid login credentials", () => {
        cy.request({
          method: "POST",
          url: "/notes/api/users/login",
          body: {
            email: "joachim.holseter@example.com",
            password: "unvalidpassword",
          },
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(401)
          expect(response.body).to.have.property("success", false)
          expect(response.body).to.have.property("status", 401)
          expect(response.body).to.have.property("message","Incorrect email address or password")
        })
      })

      let username = ""
      let myToken = ""
      let profileID = 1
      let noteID = 2

      it("Create user and check for successful status 201", () => {
        const randomUsername =
          "joachim.holseter" +
          Math.floor(Math.random() * 100000000)
            .toString()
            .padStart(8, "0") +
          "@gmail.com"
        cy.log("Created randomized username: " + randomUsername)
        username = randomUsername

        cy.request({
          method: "POST",
          url: "notes/api/users/register",
          body: {
            email: randomUsername,
            password: "validpassword",
            name: "Joachim Holseter",
          },
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(201)
          expect(response.body).to.have.property("status", 201)
          expect(response.body).to.have.property("message","User account created successfully")
          expect(response.body).to.have.property("data")
          expect(response.body.data).to.have.property("email", randomUsername)
          expect(response.body.data).to.have.property("name", "Joachim Holseter")
        })
      })

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
          myToken = response.body.data.token
          cy.log(myToken)

          cy.get('button[class="btn authorize unlocked"]').should("be.visible").click()
          cy.get('input[id="api_key_value"]').focus().type(myToken)
          cy.get('button[class="btn modal-btn auth authorize button"]').should("be.visible").click()
          cy.get('button[class="btn modal-btn auth btn-done button"]').should("be.visible").click()

          // Request with the token in the x-auth-token header to check authorization
          cy.request({
            method: "GET",
            url: "notes/api/users/profile",
            headers: {
              "x-auth-token": myToken,
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

      it("Get current profile information before changing it", () => {
        cy.request({
          method: "GET",
          url: "notes/api/users/profile",
          headers: {
            "x-auth-token": myToken, // Include the token in the x-auth-token header
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
          cy.log(profileID.toString())
        })

        // Patch request to update the user information
        const updatedInfo = {
          name: "Joacihm Holseter Updated",
          phone: "0123456789",
          company: "BOUVET ASA",
        }

        cy.request({
          method: "PATCH",
          url: "notes/api/users/profile",
          headers: {
            "x-auth-token": myToken,
          },
          body: updatedInfo,
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property("success", true)
          expect(response.body).to.have.property("status", 200)
          expect(response.body).to.have.property("message","Profile updated successful")
          expect(response.body).to.have.property("data")
          expect(response.body.data).to.have.property("name", updatedInfo.name)
          expect(response.body.data).to.have.property("phone",updatedInfo.phone)
          expect(response.body.data).to.have.property("company",updatedInfo.company)

          // Get updated profile information to validate the changes
          cy.request({
            method: "GET",
            url: "notes/api/users/profile",
            headers: {
              "x-auth-token": myToken,
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
            cy.log("User's name is: " + response.body.data.name)
            cy.log("User's email is: " + response.body.data.email)
            cy.log("User's phone is: " + response.body.data.phone)
            cy.log("User's company is: " + response.body.data.company)
            cy.log("User's ID is: " + response.body.data.id)
          })
        })
      })

      it("Post a new note through the API", () => {
        const newNote = {
          title: "Test note added through API",
          description: "This a a useless note that takes space up on someone's server :-)",
          category: "Work",
        }

        cy.request({
          method: "POST",
          url: "notes/api/notes",
          headers: {"x-auth-token": myToken},
          body: newNote,
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property("success", true)
          expect(response.body).to.have.property("status", 200)
          expect(response.body).to.have.property("data")
          expect(response.body.data).to.have.property("title", newNote.title)
          expect(response.body.data).to.have.property("description",newNote.description)
          expect(response.body.data).to.have.property("category",newNote.category)
          cy.log("Note was added with ID: " + response.body.data.id + " in category " + response.body.data.category)
          cy.log("Note has title: " + response.body.data.title)
          cy.log("Note was description: " + response.body.data.description)
          noteID = response.body.data.id
        })
      })

      it('Edit the note and set its status to "completed"', () => {
        const updatedNote = {
          completed: true,
        }

        cy.request({
          method: "PATCH",
          url: `notes/api/notes/${noteID}`,
          headers: {
            "x-auth-token": myToken,
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

      it("Delete the note we created", () => {
        cy.request({
          method: "DELETE",
          url: `notes/api/notes/${noteID}`,
          headers: {
            "x-auth-token": myToken,
          },
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property("success", true)
          expect(response.body).to.have.property("status", 200)
          expect(response.body).to.have.property("message","Note successfully deleted")
        })
      })

      it("Delete user we are signed in as", () => {
        cy.request({
          method: "DELETE",
          url: `notes/api/users/delete-account`,
          headers: {
            "x-auth-token": myToken,
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