const tourist = {
  id: 50,
  nombre: "Ana Viajera",
  correo: "ana@example.test",
  rol: "TURISTA",
  tipoCuenta: "TURISTA",
  proveedorVerificado: false,
  estadoVerificacion: "NO_APLICA",
  descripcion: "Cascadas, senderos y nuevos recuerdos en Baños.",
  paisOrigen: "Ecuador",
  direccion: "Dato privado",
  fechaNacimiento: "2000-03-15T00:00:00.000Z",
  edad: 26,
  estadisticas: { favoritos: 0, resenas: 0, lugares: 0, resenasRecibidas: 0, valoracion: null },
};

describe("Recorrido de la rúbrica de autenticación", () => {
  beforeEach(() => {
    cy.viewport(390, 844);
    cy.intercept("GET", "**/categorias", []);
    cy.intercept("GET", "**/eventos", []);
    cy.intercept("GET", "**/puntos-interes*", { datos: [], total: 0 });
    cy.intercept("GET", "**/favoritos", []);
    cy.intercept("GET", "**/usuarios/perfil", tourist);
    cy.intercept("GET", "**/usuarios/perfil/actividad*", { datos: [], total: 0, pagina: 1, limite: 12 });
  });

  it("valida, autentica, mantiene el usuario al navegar y bloquea tras salir", () => {
    cy.visit("/login");
    cy.wait(1000);

    cy.get(".login-submit:visible").last().click();
    cy.get(".login-error").should("contain", "Escribe tu correo electrónico");
    cy.get("#login-correo:visible").last().type("correo-invalido");
    cy.get(".login-submit:visible").last().click();
    cy.get(".login-error").should("contain", "Revisa tu correo electrónico");

    cy.get("#login-correo:visible").last().clear().type(tourist.correo);
    cy.get("#login-password:visible").last().type("clave-mal-formada");
    cy.intercept("POST", "**/auth/login", (request) => {
      if (request.body.password === "clave-mal-formada") {
        request.reply({ statusCode: 401, body: { message: "Credenciales incorrectas" } });
        return;
      }
      request.reply({ usuario: tourist, accessToken: "fixture-token", refreshToken: "fixture-refresh" });
    }).as("login");
    cy.get(".login-submit:visible").last().click();
    cy.wait("@login");
    cy.get(".login-error").should("contain", "Credenciales incorrectas");

    cy.get("#login-password:visible").last().clear().type("fixture-password");
    cy.get(".login-submit:visible").last().click();
    cy.wait("@login");
    cy.location("pathname").should("equal", "/home");
    cy.get(".tourist-intro").should("contain", "Ana");

    cy.get('.banos-bottom-nav:visible a[href="/catalogo"]').last().click();
    cy.location("pathname").should("equal", "/catalogo");
    cy.get('.banos-bottom-nav:visible a[href="/favoritos"]').last().click();
    cy.location("pathname").should("equal", "/favoritos");
    cy.get('.banos-bottom-nav:visible a[href="/perfil"]').last().click();
    cy.location("pathname").should("equal", "/perfil");
    cy.get(".profile-hero h1").should("contain", tourist.nombre);

    cy.intercept("POST", "**/auth/logout", { statusCode: 204 }).as("logout");
    cy.get('ion-button[aria-label="Ajustes de cuenta"]').click();
    cy.contains(".profile-settings ion-button", "Salir").click();
    cy.wait("@logout");
    cy.location("pathname").should("equal", "/login");

  });
});






