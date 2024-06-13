import { random } from "lodash"

// Define the debug mode boolean at the top level
const debugMode2 = false // Set to true for debug mode, false to disable

// Helper function for conditional wait
const debugWait2 = () => {
  if (debugMode2) {
    cy.wait(500) // Adjust the wait time as needed
  }
}

describe("Go through all examples on site", () => {
  beforeEach(() => {
   cy.visit("https://practice.expandtesting.com/")
  })

  context("Inputs test", () => {
    it("Check input of all fields and show output", () => {
      cy.get('a[href="/inputs"]').should("be.visible").click()
      cy.get('button[id="btn-clear-inputs"]').should("be.visible").click()
      debugWait2()
      cy.get('input[id="input-number"]').focus().type("A5982")
      debugWait2()
      cy.get('input[id="input-text"]').focus().type("Joachim Holseter")
      debugWait2()
      cy.get('input[id="input-password"]').focus().type("SQAD")
      debugWait2()
      cy.get('input[id="input-date"]').focus().type("1997-02-17")
      debugWait2()
      cy.get('button[id="btn-display-inputs"]').click()
      debugWait2()
      cy.get("#output-number").should("be.visible").should("have.text", "5982")
      debugWait2()
      cy.get("#output-text")
        .should("be.visible")
        .should("have.text", "Joachim Holseter")
      debugWait2()
      cy.get("#output-password")
        .should("be.visible")
        .should("have.text", "SQAD")
      debugWait2()
      cy.get("#output-date")
        .should("be.visible")
        .should("have.text", "1997-02-17")
      debugWait2()
      cy.log("Inputs test passed")
      debugWait2()
    })
  })

  context("Add and remove elements test", () => {
    it("Check input of all fields and show output", () => {
      cy.get('a[href="/add-remove-elements"]').should("be.visible").click()
      debugWait2()

      // Click the add button 10 times to create 10 elements
      Cypress._.times(10, () => {
        cy.get('button[class="btn btn-primary mt-3"]').should("exist").click()
        debugWait2()
      })

      // Ensure all 10 elements are created
      cy.get('button[class="added-manually btn btn-info"]').should(
        "have.length",
        10
      )

      // Perform actions on each of the 10 elements
      cy.get('button[class="added-manually btn btn-info"]').each(
        ($el, index) => {
          cy.wrap($el).click()
          debugWait2()
        }
      )
      cy.get('div[id="elements"]').children().should("have.length", 0)
      cy.log("Add and remove test passed")
      debugWait2()
    })
  })

  context("Notification messages test", () => {
    it('Should ensure the popup message says "Action successful"', () => {
      cy.get('a[href="/notification-message"]').click()
      // Function to check the popup message
      const checkPopupMessage = () => {
        cy.get("div#flash b").then(($element) => {
          const text = $element.text().trim()
          if (text === "Action unsuccessful, please try again") {
            // Click the retry button if the message is unsuccessful
            cy.get('a[href="/notification-message"]').click()
            // Check the message again
            checkPopupMessage()
          } else {
            // Assert that the message is successful
            expect(text).to.eq("Action successful")
            cy.log("Notification test passed")
            debugWait2()
          }
        })
      }

      // Initial call to the function
      checkPopupMessage()
    })
  })

  context("Dynamic table test", () => {
    it("Compare the chart and find matching CPU usage", () => {
      cy.get('a[href="/dynamic-table"]').click()

      cy.get('div[class="table-responsive"]')

      // Define a variable to hold the extracted number
      let CpuUsage

      // Define a flag to stop further processing once a match is found
      let matchFound = false

      // Get the text from the element and extract the number
      cy.get("p#chrome-cpu")
        .invoke("text")
        .then((text) => {
          // Extract the number from the text using a regular expression
          const cpuUsage = parseFloat(text.match(/(\d+(\.\d+)?)/)[0])

          // Store the extracted number in the variable
          CpuUsage = cpuUsage
          cy.log("Chrome CPU usage: " + cpuUsage.toString() + "%")
        })
      // Step 2: Loop through all td elements and compare values ending with "%"
      cy.get("div.table-responsive table tbody tr").each(($tr) => {
        // Stop further processing if a match has already been found
        if (matchFound) {
          return
        }

        // Find the td elements within each row
        cy.wrap($tr)
          .find("td")
          .each(($td) => {
            // Stop further processing if a match has already been found
            if (matchFound) {
              return
            }

            cy.wrap($td)
              .invoke("text")
              .then((text) => {
                // Check if the text contains a "%"
                if (text.includes("%")) {
                  // Remove non-numeric characters and convert the text content to a floating-point number
                  const tdValue = parseFloat(text.replace(/[^\d.]/g, ""))

                  // Log the value for debugging purposes
                  cy.log(`td value: ${tdValue}`)

                  // Compare the value with CpuUsage
                  if (tdValue === CpuUsage) {
                    cy.log(`Match found: ${tdValue}`)
                    matchFound = true
                    cy.log("Found match in table. Test passed.")
                    debugWait2()
                  }
                }
              })
          })
      })
      cy.visit("https://practice.expandtesting.com/#examples")
    })
  })

  context("Browser information test", () => {
    it("Open and view browser information", () => {
      cy.get('a[href="/my-browser"]').click()
      cy.get('button[id="browser-toggle"]').should("exist").click()
      debugWait2()
      cy.wait(100)
      cy.get('div[id="browser-info"]').should("exist")
      debugWait2()
      cy.get('td[id="browser-name"]').should("have.text", "Google Chrome")
      cy.wait(100)
      cy.get('button[id="browser-toggle"]').should("exist").click()
      debugWait2()
      cy.wait(100)

      cy.log("Browser is Google Chrome, test passed")
      debugWait2()
      cy.visit("https://practice.expandtesting.com/#examples")
    })
  })

  context("Login validation test", () => {
    it("Login with invalid credentials", () => {
      cy.get('a[href="/login"]').click()
      cy.get('input[id="username"]').focus().type("JoachimHolseter")
      debugWait2()
      cy.get('input[id="password"]').focus().type("Password1")
      debugWait2()
      cy.get('button[class="btn btn-bg btn-primary d-block w-100"]')
        .should("exist")
        .click()
      debugWait2()
      cy.wait(200)
      cy.get('div[id="flash"]').should("contain", "invalid")
      cy.log("Invalid credentials, test passed")
      debugWait2()
    })
    it("Login with valid credentials", () => {
      cy.get('a[href="/login"]').click()
      cy.get('input[id="username"]').focus().type("practice")
      debugWait2()
      cy.get('input[id="password"]').focus().type("SuperSecretPassword!")
      debugWait2()
      cy.get('button[class="btn btn-bg btn-primary d-block w-100"]')
        .should("exist")
        .click()
      debugWait2()
      cy.wait(200)
      cy.get('div[id="flash"]').should(
        "contain",
        "You logged into a secure area!"
      )
      cy.url().should("include", "/secure")
      cy.log("Valid credentials, test passed")
      debugWait2()
      cy.get('a[class="button secondary radius"]').click()
      cy.wait(200)
      cy.url().should("include", "/login")
      debugWait2()
      cy.visit("https://practice.expandtesting.com/#examples")
    })
  })

  context("Check for broken images", () => {
    it("Two out of three images are still broken", () => {
      cy.visit("https://practice.expandtesting.com/broken-images")

      cy.get("img").each(($img) => {
        // Ensure the image is visible and check its natural width and height
        cy.wrap($img)
          .should("be.visible")
          .then(($img) => {
            // Access the DOM element directly and assert its type to HTMLImageElement
            const img: HTMLImageElement = $img[0] as HTMLImageElement
            if (img.naturalWidth === 0 || img.naturalHeight === 0) {
              // Log a message if the image is broken
              cy.log("Broken image found: ", img.src)
            } else {
              // Log a message if the image is not broken
              cy.log("Valid image found: ", img.src)
            }
          })
      })
    })
  })

  context("Simple API response checks", () => {
    it('Check health API', () => {
      // Intercept the health check API request
      cy.intercept('GET', '/api/health-check').as('healthCheckRequest');
  
      // Make the API request directly
      cy.request('/api/health-check').then((response) => {
        // Assert on the status and body of the response
        expect(response.status).to.eq(200);
        expect(response.body.status).to.eq('UP');
        expect(response.body.message).to.eq('API is up!');
      });
    });

    it('Check IP API', () => {
      // Intercept the IP API request
      cy.intercept('GET', '/api/my-ip').as('ipCheckRequest');
  
      // Make the API request directly
      cy.request('/api/my-ip').then((response) => {
        // Assert on the status and body of the response
        expect(response.status).to.eq(200);
        cy.log("User is in "+response.body.city+", "+response.body.country+". Their IP is: "+response.body.ip);
      });
    });
  });
  
})
