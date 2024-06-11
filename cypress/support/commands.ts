/// <reference types="cypress" />
declare namespace Cypress {
    interface Chainable {
      getByData(selector: string): Chainable<JQuery<HTMLElement>>;
    }
  }
Cypress.Commands.add("getByData", (selector) => {
    return cy.get(`[data-test=${selector}]`)
})