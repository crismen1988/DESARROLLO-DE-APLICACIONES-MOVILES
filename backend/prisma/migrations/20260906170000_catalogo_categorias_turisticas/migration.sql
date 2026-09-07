INSERT INTO "categorias" ("nombre", "descripcion", "activa", "creada_en", "actualizada_en") VALUES
    ('Alojamiento', 'Hoteles, hostales, cabañas y apartamentos.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Gastronomía', 'Restaurantes, cafeterías, bares y comida típica.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Atractivos turísticos', 'Cascadas, miradores, termas, parques y lugares naturales.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Actividades y aventura', 'Canopy, rafting, canyoning, puenting y senderismo.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Cultura e historia', 'Iglesias, museos, monumentos y lugares tradicionales.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Transporte', 'Taxis, terminal, bicicletas y transporte turístico.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Compras y artesanías', 'Artesanías, tiendas locales y productos típicos.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Servicios útiles', 'Farmacias, hospitales, bancos, cajeros e información turística.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("nombre") DO UPDATE SET
    "descripcion" = EXCLUDED."descripcion",
    "activa" = true;
