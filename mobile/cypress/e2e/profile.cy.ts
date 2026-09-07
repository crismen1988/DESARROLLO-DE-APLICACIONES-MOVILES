const baseProfile = {
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
  estadisticas: {
    favoritos: 1,
    resenas: 1,
    lugares: 0,
    resenasRecibidas: 0,
    valoracion: null,
  },
};
const lugar = {
  id: 1,
  nombre: "Pailón del Diablo",
  descripcion: "Una cascada en Baños",
  estado: "ACTIVO",
  categoria: { nombre: "Naturaleza" },
  calificacionPromedio: 4.8,
  totalResenas: 12,
  imagenes: [
    { url: "/assets/icono_banos_tour.jpg", textoAlternativo: "BañosTour" },
  ],
};
const entrar = (provider = false, legacy = false) => {
  const perfil = provider
    ? {
        ...baseProfile,
        rol: "PROVEEDOR",
        tipoCuenta: "PRESTADOR_TURISTICO",
        nombreComercial: "Aventuras en Baños",
        proveedorVerificado: true,
        estadisticas: {
          ...baseProfile.estadisticas,
          lugares: 1,
          resenasRecibidas: 12,
          valoracion: 4.8,
        },
      }
    : baseProfile;
  cy.intercept("POST", "**/auth/login", {
    usuario: perfil,
    accessToken: "fixture-token",
    refreshToken: "fixture-refresh",
  });
  cy.intercept("GET", "**/usuarios/perfil", legacy ? { ...perfil, estadisticas: undefined } : { ...perfil }).as("profile");
  cy.intercept("GET", "**/usuarios/perfil/actividad*", (req) => {
    const tipo = req.query.tipo;
    req.reply({
      datos: [
        {
          id: 1,
          puntoInteres: lugar,
          ...(tipo === "resenas"
            ? {
                comentario: "Una experiencia inolvidable.",
                calificacion: 5,
                creadoEn: "2026-09-06T12:00:00Z",
              }
            : {}),
        },
      ],
      total: 1,
      pagina: 1,
      limite: 12,
    });
  }).as("activity");
  cy.visit("/login");
  // Ionic resets login fields during its first entry transition.
  cy.wait(1000);
  cy.get(".login-page").should("not.have.class", "ion-page-invisible");
  cy.get("#login-correo").clear().type("ana@example.test", { delay: 0 }).should("have.value", "ana@example.test");
  cy.get("#login-password").type("fixture-password");
  cy.get(".login-submit").click();
  cy.get('.home-page .banos-bottom-nav a[href="/perfil"]').click();
  cy.wait("@profile");
  cy.wait("@activity");
  if (!legacy) cy.get(".profile-hero h1").should(
    "contain",
    provider ? "Aventuras en Baños" : "Ana Viajera",
  );
};

describe("Perfil turístico", () => {
  beforeEach(() => cy.viewport(390, 844));

  it("muestra un error recuperable si el backend devuelve el perfil anterior sin estadísticas", () => {
    entrar(false, true);
    cy.get('.profile-page .profile-error').should('contain', 'No se pudo cargar el perfil');
    cy.get('.profile-page .banos-bottom-nav').should('be.visible');
    cy.intercept('GET', '**/usuarios/perfil', baseProfile);
    cy.contains('.profile-page ion-button', 'Reintentar').click();
    cy.get('.profile-hero h1').should('contain', 'Ana Viajera');
  });

  it("muestra identidad, actividad real y navegación con el estilo de BañosTour", () => {
    entrar();
    cy.get(".profile-hero")
      .should("not.contain", baseProfile.correo)
      .and("not.contain", baseProfile.direccion);
    cy.get(".profile-place-card").should("contain", "Pailón del Diablo");
    cy.get(".profile-page ion-content")
      .should("have.css", "--background")
      .and("contain", "#e4f3ef");
    cy.get(".profile-page .banos-bottom-nav .is-active").should(
      "contain",
      "Perfil",
    );
    cy.screenshot("perfil-turista", { capture: "viewport" });
    cy.get("#profile-tab-resenas").click();
    cy.get(".profile-review").should("contain", "Una experiencia inolvidable.");
    cy.get("#profile-tab-resenas").focus().type("{leftarrow}");
    cy.get("#profile-tab-favoritos").should(
      "have.attr",
      "aria-selected",
      "true",
    );
  });

  it("descarta cambios al cancelar y conserva los datos al guardar", () => {
    entrar();
    cy.contains(".profile-main-actions ion-button", "Editar perfil").click();
    cy.get("ion-modal .profile-form input").first().clear().type("Nombre descartado");
    cy.contains("ion-modal ion-button", "Cancelar").click();
    cy.get(".profile-hero h1").should("contain", "Ana Viajera");
    cy.contains(".profile-main-actions ion-button", "Editar perfil").click();
    cy.get("ion-modal .profile-form input")
      .first()
      .should("have.value", "Ana Viajera")
      .clear()
      .type("Ana Exploradora");
    cy.intercept("PATCH", "**/usuarios/perfil", (req) => {
      expect(req.body.direccion).to.equal("Dato privado");
      req.reply({ ...baseProfile, ...req.body });
    }).as("save");
    cy.screenshot("perfil-editar", { capture: "viewport" });
    cy.contains("ion-modal ion-button", "Guardar cambios").click();
    cy.wait("@save");
    cy.get(".profile-hero h1").should("contain", "Ana Exploradora");
    cy.get(".profile-success").should("be.visible");
  });

  it("distingue errores de listas vacías y permite reintentar", () => {
    entrar();
    cy.intercept("GET", "**/usuarios/perfil/actividad*", {
      statusCode: 500,
      body: {},
    });
    cy.get("#profile-tab-resenas").click();
    cy.get(".profile-activity .profile-error").should("be.visible");
    cy.get(".profile-empty").should("not.exist");
    cy.intercept("GET", "**/usuarios/perfil/actividad*", {
      datos: [],
      total: 0,
      pagina: 1,
      limite: 12,
    });
    cy.contains(".profile-activity ion-button", "Reintentar").click();
    cy.get(".profile-empty").should("contain", "Tu primera reseña");
    cy.screenshot("perfil-vacio", { capture: "viewport" });
  });

  it("adapta las estadísticas y lugares para prestadores", () => {
    entrar(true);
    cy.get(".profile-verification").should("contain", "Proveedor verificado");
    cy.get(".profile-stats").should("contain", "4.8").and("contain", "12");
    cy.get("#profile-tab-lugares").click();
    cy.get(".profile-place-card").should("contain", "Pailón del Diablo");
    cy.screenshot("perfil-prestador", { capture: "viewport" });
    cy.viewport(320, 740);
    cy.get(".profile-content").then(($element) =>
      expect($element[0].scrollWidth).to.be.at.most(320),
    );
  });
});




