/* 
Automated E2E test of "Coffee Cart", an example webshop created for use with automated testing.
This is just an example to show how E2E testing with Cypress can be done.
Documentation can be found here: https://coffee-cart.app/github.
Created by Joachim Holseter, Bouvet SQAD, June 2024.
*/




// Enable this bool to get a 500ms delay between actions to better observe what's happening.
// This might be silly to do in a real test.

const debugMode = false; // Set to true for debug mode, false to disable

const debugWait = () => {
  if (debugMode) {
    cy.wait(500); // Adjust the wait time as needed
  }
};

describe("Full E2E test", () => {
  beforeEach(() => {
    cy.visit("https://coffee-cart.app/");
  });

  // Before starting, we check that all content exists and that the names of the header buttons are correct.
  context("Check site content", () => {
    it("The header includes all elements.", () => {
      cy.get("[aria-label='Menu page']").should("exist").contains("menu");
      debugWait();
      cy.get("[aria-label='Cart page']").should("exist").contains("cart");
      debugWait();
      cy.get("[aria-label='GitHub page']").should("exist").contains("github");
      debugWait();
    });

    // We test that the buttons in the header work and navigates to the correct URL.
    it("The header buttons work.", () => {
      cy.get("[aria-label='Cart page']").click();
      debugWait();
      cy.location("pathname").should("eq", "/cart");
      debugWait();

      cy.get("[aria-label='GitHub page']").click();
      debugWait();
      cy.location("pathname").should("eq", "/github");
      debugWait();

      cy.get("[aria-label='Menu page']").click();
      debugWait();
      cy.location("pathname").should("eq", "/");
      debugWait();
    });

    // We check that the parent element of the coffee-items has children.
    it("Check that there is content visible", () => {
      cy.get("ul[data-v-a9662a08] li").should("have.length.greaterThan", 0);
      debugWait();
    });

    // Validate that all coffee-items has a name and a price
    it("Loop through each coffee item and check the name and price", () => {
      cy.get("ul[data-v-a9662a08] li")
        .should("have.length.greaterThan", 0)
        .then(($list) => {
          const itemCount = $list.length;

          cy.wrap($list).each(($el, index) => {
            cy.wrap($el).within(() => {
              cy.get("h4")
                .invoke("text")
                .then((text) => {
                  // Split the text to extract name and price
                  const [name, priceWithDollarSign] = text.split(" $");
                  const price = parseFloat(priceWithDollarSign);

                  // Assertions
                  expect(name).to.not.be.empty;
                  expect(price).to.be.a('number').and.to.be.greaterThan(0);

                  // Logging
                  cy.log(`The name of element ${index + 1} is: ${name}`);
                  cy.log(`The price of element ${index + 1} is: $${price.toFixed(2)}`);
                });
            });
          });

          cy.then(() => {
            cy.log(`All ${itemCount} items have a name and a price`);
            debugWait();
          });
        });
    });
  });


  // Next we go through the checkout process. We add 10 random coffees to the cart, accepting and declining the promo offer with a flip flop each time it shows up.
  context("Add items and check out", () => {
    it("Randomly adds coffees to the cart and goes through checkout", () => {
      let flipFlop = true;

      Cypress._.times(10, () => {
        debugWait();
        cy.get(".cup").then(($cups) => {
          const itemCount = $cups.length;
          const randomIndex = Math.floor(Math.random() * itemCount);
          cy.wrap($cups[randomIndex])
            .trigger("mouseover")
            .trigger("mousedown")
            .trigger("mouseup")
            .trigger("click");

          cy.get("body").then(($body) => {
            if ($body.find(".promo").length > 0) {
              if (flipFlop) {
                cy.get(".promo .buttons .yes").click();
                cy.log('Clicked "Yes, of course!" button');
              } else {
                cy.get("button").eq(1).click();
                cy.log('Clicked "Nah, I\'ll skip." button');
              }
              flipFlop = !flipFlop;
            }
          });
        });
      });

      cy.log("Check that total does not equal zero if cart has more that 0 items");
      debugWait();

      // Get the cart items count
      cy.get('a[aria-label="Cart page"]')
        .invoke("text")
        .then((text) => {
          // Extract the number of items in the cart
          const itemCount = Number(text.match(/\((\d+)\)/)[1]);
          debugWait();

          // Check the total price based on item count
          if (itemCount > 0) {
            cy.get('button[data-test="checkout"]').should("not.have.text", "Total: $0.00");
            debugWait();
          } else {
            cy.get('button[data-test="checkout"]').should("have.text", "Total: $0.00");
            debugWait();
          }
        });

      // Proceed to checkout after adding items to the cart
      cy.log('Clicked "Go to checkout"');
      debugWait();
      cy.get("[aria-label='Cart page']").click();
      debugWait();

      // Set initial total
      cy.get('button[data-test="checkout"]')
        .invoke("text")
        .then((previousTotal) => {
          // Function to add, remove, and delete items and check the total
          const checkAndChangeTotal = (actionSelector, actionDescription) => {
            cy.get(".list>div>ul")
              .children(".list-item")
              .should("have.length.greaterThan", 0)
              .then(($items) => {
                const randomItemsIndex = Math.floor(Math.random() * $items.length);

                // Perform the action
                cy.wrap($items[randomItemsIndex]).within(() => {
                  cy.get(actionSelector).click({ force: true });
                });

                // Verify the total has changed
                cy.get('button[data-test="checkout"]')
                  .invoke("text")
                  .then((newTotal) => {
                    expect(newTotal).to.not.eq(previousTotal);
                    previousTotal = newTotal;
                    debugWait();
                    cy.log(`${actionDescription} was successful. New total is ${newTotal}`);
                  });
              });
          };

          // Add one item
          checkAndChangeTotal('button[aria-label*="Add one"]', "Adding one item");
          debugWait();

          // Remove one item
          checkAndChangeTotal('button[aria-label*="Remove one"]', "Removing one item");
          debugWait();

          // Delete one item
          checkAndChangeTotal('button[aria-label*="Remove all"]', "Deleting item");
          debugWait();

          // Click checkout information and fill in requred fields
          cy.get("[aria-label='Proceed to checkout']").click();
          debugWait();
          cy.get('input[id="name"]').type("John Doe");
          debugWait();
          cy.get('input[id="email"]').type("john@aol.com");
          debugWait();
          cy.get("[aria-label='Promotion checkbox']").click();
          debugWait();
          cy.get('button[id="submit-payment"]').click();
          debugWait();
          cy.get('div[class="snackbar success"]').should("exist");
        });
    });
  });
});
