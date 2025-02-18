describe('Dashboard', () => {
  beforeEach(() => {
    cy.login() // Custom command that handles authentication
    cy.visit('/dashboard')
  })

  it('displays content items and allows filtering', () => {
    cy.get('.content-grid article').should('have.length.gt', 0)
    
    cy.get('input[placeholder="Search content..."]')
      .type('test content')
    
    cy.get('.content-grid article').should('have.length.gte', 0)
  })

  it('handles pagination', () => {
    cy.get('.pagination button').contains('Next').click()
    cy.get('.pagination span').should('contain', 'Page 2')
    
    cy.get('.pagination button').contains('Previous').click()
    cy.get('.pagination span').should('contain', 'Page 1')
  })

  it('allows marking items as read', () => {
    cy.get('.content-grid article')
      .first()
      .within(() => {
        cy.get('button').contains('Mark read').click()
        cy.get('button').should('contain', 'Mark unread')
      })
  })
})
