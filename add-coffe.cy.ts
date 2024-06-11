describe('home page', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3000')
    })


    context("Hero section", () => {
      it('the h1 contains the correct text.', () => {
        cy.get("[data-test='hero-heading']").should("exist").contains("Testing Next.js Applications with Cypress")
        })
    
        it('The features on the homepage are correct', () => {
          cy.get("dt").eq(0).should("exist").contains("4 Courses")
          cy.get("dt").eq(1).should("exist").contains("25+ Lessons")
          cy.get("dt").eq(2).should("exist").contains("Free and Open Source")
        })
    })

    context("Courses section, buttons and links are correct", () => {
      it("Course: Testing Your First Next.js Application", () => {
        cy.getByData("course-0").find("a").eq(3).click()
        cy.location("pathname").should("eq", "/testing-your-first-application")
        cy.go('back')
      })


      it("Course: Testing Foundations", () => {
        cy.getByData("course-1").find("a").eq(3).click()
        cy.location("pathname").should("eq", "/testing-foundations")
        cy.go('back')
      })


      it("Course: Cypress Fundamentals", () => {
        cy.getByData("course-2").find("a").eq(3).click()
        cy.location("pathname").should("eq", "/cypress-fundamentals")
        cy.go('back')
      })

    })

})