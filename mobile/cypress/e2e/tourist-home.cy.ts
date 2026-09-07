const categorias = [
  { id: 8, nombre: "Alojamiento" },
  { id: 9, nombre: "Gastronomía" },
  { id: 10, nombre: "Atractivos turísticos" },
  { id: 11, nombre: "Actividades y aventura" },
  { id: 12, nombre: "Cultura e historia" },
  { id: 13, nombre: "Transporte" },
  { id: 14, nombre: "Compras y artesanías" },
  { id: 15, nombre: "Servicios útiles" },
];
const evento = {
  id: 1,
  titulo: "Encuentro de sabores locales",
  descripcion: "Una tarde para conocer la gastronomía de Baños.",
  fechaInicio: "2026-10-18T17:00:00Z",
  fechaFin: "2026-10-18T22:00:00Z",
  direccion: "Parque central",
  puntoInteres: null,
};
const entrarTurista = () => {
  cy.intercept("POST", "**/auth/login", {
    usuario: {
      id: 50,
      nombre: "Ana Viajera",
      correo: "ana@example.test",
      rol: "TURISTA",
    },
    accessToken: "fixture-token",
    refreshToken: "fixture-refresh",
  });
  cy.visit("/login");
  cy.wait(1000); // Wait for Ionic's initial entry transition before editing fields.
  cy.get("#login-correo").type("ana@example.test");
  cy.get("#login-password").type("fixture-password");
  cy.get(".login-submit").click();
  cy.get(".tourist-intro h1").should("contain", "Tu próxima aventura");
};

describe("Inicio del turista", () => {
  beforeEach(() => {
    cy.viewport(390, 720);
    cy.intercept("GET", "**/categorias", categorias).as("categories");
    cy.intercept("GET", "**/eventos", [evento]).as("events");
    cy.intercept("GET", "**/puntos-interes*", (request) => {
      request.alias = request.query.pagina === '2' ? 'secondPage' : request.query.busqueda ? 'searchedPlaces' : request.query.categoriaId ? 'categoryPlaces' : 'allPlaces';
      request.reply({
        datos: [
          {
            id: Number(request.query.pagina ?? 1),
            nombre:
              request.query.pagina === "2"
                ? "Otra cascada"
                : "Cascada de prueba",
            descripcion: "Un lugar por descubrir",
            categoria: categorias[2],
          },
        ],
        total: 21,
      });
    }).as("places");
  });

  it("consolida navegación y mantiene categorías, búsqueda y paginación funcionales", () => {
    entrarTurista();
    cy.wait("@categories");
    cy.get(".tourist-home .banos-bottom-nav a").should("have.length", 4);
    cy.get(
      ".tourist-home .home-profile-button, .tourist-home .home-action-grid",
    ).should("not.exist");
    cy.get(".tourist-home-header").should("not.contain", "Salir");
    cy.get('.tourist-category-icon ion-icon').first().shadow().find('svg').should('exist');
    cy.screenshot("inicio-turista", { capture: "viewport" });
    cy.contains(
      ".tourist-category-grid button",
      "Atractivos turísticos",
    ).click();
    cy.wait("@categoryPlaces").its("request.query.categoriaId").should("equal", "10");
    cy.get(".catalog-filters .selected").should(
      "contain",
      "Atractivos turísticos",
    );
    cy.get(".catalog-page .place-search input").type("cascada{enter}");
    cy.wait("@searchedPlaces").then(({ request }) => {
      expect(request.query.busqueda).to.equal("cascada");
      expect(request.query.categoriaId).to.equal("10");
    });
    cy.contains(".catalog-pagination ion-button", "Siguiente").click();
    cy.wait("@secondPage").its("request.query.pagina").should("equal", "2");
    cy.get(".catalog-place").should("contain", "Otra cascada");
    cy.contains(".catalog-page ion-button", "Limpiar filtros").click();
    cy.wait("@allPlaces").then(({ request }) => {
      expect(request.query).not.to.have.property("busqueda");
      expect(request.query).not.to.have.property("categoriaId");
      expect(request.query.pagina).to.equal("1");
    });
  });

  it("muestra los detalles reales de agenda y se adapta a pantallas pequeñas", () => {
    entrarTurista();
    cy.wait("@events");
    cy.get(".tourist-event summary").click();
    cy.get(".tourist-event[open]")
      .should("contain", "Parque central")
      .and("contain", "12:00")
      .and("contain", "17:00");
    cy.get(".tourist-agenda").scrollIntoView();
    cy.screenshot("inicio-agenda", { capture: "viewport" });
    cy.viewport(320, 640);
    cy.get(".tourist-intro").scrollIntoView();
    cy.get(".tourist-content").then(($element) =>
      expect($element[0].scrollWidth).to.be.at.most(320),
    );
    cy.screenshot("inicio-turista-estrecho", { capture: "viewport" });
    cy.viewport(1280, 720);
    cy.get('.tourist-home ion-content').then($element => ($element[0] as HTMLIonContentElement).scrollToTop(0));
    cy.screenshot("inicio-turista-escritorio", { capture: "viewport" });
  });

  it("permite recuperar categorías sin ocultar la agenda y distingue ausencia de eventos", () => {
    cy.intercept("GET", "**/categorias", { statusCode: 500, body: {} });
    cy.intercept("GET", "**/eventos", []);
    entrarTurista();
    cy.get('.tourist-categories [role="alert"]').should(
      "contain",
      "No se pudieron cargar",
    );
    cy.get(".tourist-agenda-empty").should(
      "contain",
      "Sin eventos programados",
    );
    cy.intercept("GET", "**/categorias", categorias);
    cy.contains(".tourist-categories ion-button", "Reintentar").click();
    cy.get(".tourist-category-grid button").should("have.length", 8);
    cy.get('.tourist-home .banos-bottom-nav a[href="/perfil"]').should("exist");
    cy.get('.tourist-home .banos-bottom-nav a[href="/favoritos"]').should(
      "exist",
    );
  });
});
