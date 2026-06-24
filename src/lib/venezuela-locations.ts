export interface City {
  name: string;
  parishes?: string[];
}

export interface State {
  name: string;
  cities: City[];
}

export const VENEZUELA_LOCATIONS: State[] = [
  {
    name: "Aragua",
    cities: [
      {
        name: "La Victoria",
        parishes: [
          "Juan Vicente Bolívar",
          "Castor Nieves Ríos",
          "Las Guacamayas",
          "Pao de Zárate",
          "Zuata"
        ]
      },
      {
        name: "Maracay",
        parishes: [
          "Las Delicias",
          "Choroní",
          "Madre María de San José",
          "Joaquín Crespo",
          "Pedro José Ovalle",
          "José Casanova Godoy",
          "Andrés Eloy Blanco",
          "Los Tacarigua"
        ]
      },
      { name: "Turmero" },
      { name: "Cagua" },
      { name: "El Limón" },
      { name: "San Mateo" },
      { name: "Villa de Cura" },
      { name: "Las Tejerías" },
      { name: "San Sebastián de los Reyes" },
      { name: "San Casimiro" },
      { name: "Camatagua" },
      { name: "Barbacoas" },
      { name: "Ocumare de la Costa" }
    ]
  },
  {
    name: "Distrito Capital",
    cities: [
      {
        name: "Caracas",
        parishes: [
          "El Recreo",
          "Sucre (Catia)",
          "La Candelaria",
          "Altagracia",
          "Catedral",
          "Santa Teresa",
          "El Valle",
          "Coche",
          "Caricuao",
          "Antímano",
          "La Vega",
          "El Paraíso",
          "San Juan",
          "Santa Rosalía",
          "San Pedro",
          "San Agustín",
          "23 de Enero",
          "Macarao",
          "La Pastora",
          "San José",
          "El Junquito"
        ]
      }
    ]
  },
  {
    name: "Miranda",
    cities: [
      { name: "Chacao" },
      { name: "Baruta" },
      { name: "El Hatillo" },
      { name: "Petare" },
      { name: "Los Teques" },
      { name: "Guarenas" },
      { name: "Guatire" },
      { name: "Ocumare del Tuy" },
      { name: "Charallave" },
      { name: "Cúa" },
      { name: "Higuerote" },
      { name: "Río Chico" },
      { name: "San Antonio de los Altos" }
    ]
  },
  {
    name: "Carabobo",
    cities: [
      { name: "Valencia" },
      { name: "Puerto Cabello" },
      { name: "Guacara" },
      { name: "Naguanagua" },
      { name: "San Diego" },
      { name: "Mariara" },
      { name: "Tocuyito" },
      { name: "Morón" }
    ]
  },
  {
    name: "Zulia",
    cities: [
      { name: "Maracaibo" },
      { name: "San Francisco" },
      { name: "Cabimas" },
      { name: "Ciudad Ojeda" },
      { name: "Santa Rita" },
      { name: "Machiques" },
      { name: "La Villa del Rosario" },
      { name: "Ports de Altagracia" }
    ]
  },
  {
    name: "Lara",
    cities: [
      { name: "Barquisimeto" },
      { name: "Cabudare" },
      { name: "Carora" },
      { name: "El Tocuyo" },
      { name: "Quíbor" },
      { name: "Duaca" },
      { name: "Sanare" },
      { name: "Sarare" }
    ]
  },
  {
    name: "Anzoátegui",
    cities: [
      { name: "Barcelona" },
      { name: "Puerto La Cruz" },
      { name: "El Tigre" },
      { name: "Anaco" },
      { name: "Lechería" },
      { name: "Guanta" },
      { name: "Cantaura" },
      { name: "San José de Guanipa" }
    ]
  },
  {
    name: "Bolívar",
    cities: [
      { name: "Ciudad Guayana" },
      { name: "Ciudad Bolívar" },
      { name: "Upata" },
      { name: "Tumeremo" },
      { name: "Guasipati" },
      { name: "Caicara del Orinoco" },
      { name: "Santa Elena de Uairén" }
    ]
  },
  {
    name: "Táchira",
    cities: [
      { name: "San Cristóbal" },
      { name: "Táriba" },
      { name: "Rubio" },
      { name: "San Antonio del Táchira" },
      { name: "La Grita" },
      { name: "Colón" },
      { name: "Michelena" }
    ]
  },
  {
    name: "Mérida",
    cities: [
      { name: "Mérida" },
      { name: "El Vigía" },
      { name: "Tovar" },
      { name: "Ejido" },
      { name: "Nueva Bolivia" },
      { name: "Lagunillas" }
    ]
  },
  {
    name: "Falcón",
    cities: [
      { name: "Coro" },
      { name: "Punto Fijo" },
      { name: "Tucacas" },
      { name: "La Vela de Coro" },
      { name: "Dabajuro" },
      { name: "Chichiriviche" }
    ]
  },
  {
    name: "Sucre",
    cities: [
      { name: "Cumaná" },
      { name: "Carúpano" },
      { name: "Güiria" },
      { name: "Cariaco" },
      { name: "Casanay" }
    ]
  },
  {
    name: "Monagas",
    cities: [
      { name: "Maturín" },
      { name: "Caripe" },
      { name: "Punta de Mata" },
      { name: "Temblador" },
      { name: "Caicara de Maturín" }
    ]
  },
  {
    name: "Portuguesa",
    cities: [
      { name: "Acarigua" },
      { name: "Araure" },
      { name: "Guanare" },
      { name: "Turén" },
      { name: "Ospino" }
    ]
  },
  {
    name: "Yaracuy",
    cities: [
      { name: "San Felipe" },
      { name: "Yaritagua" },
      { name: "Chivacoa" },
      { name: "Nirgua" },
      { name: "Cocorote" }
    ]
  },
  {
    name: "Trujillo",
    cities: [
      { name: "Valera" },
      { name: "Trujillo" },
      { name: "Boconó" },
      { name: "Sabana de Mendoza" },
      { name: "Pampán" }
    ]
  },
  {
    name: "Barinas",
    cities: [
      { name: "Barinas" },
      { name: "Socopó" },
      { name: "Sabaneta" },
      { name: "Santa Bárbara" },
      { name: "Pedraza" }
    ]
  },
  {
    name: "Nueva Esparta",
    cities: [
      { name: "Porlamar" },
      { name: "La Asunción" },
      { name: "Pampatar" },
      { name: "Juan Griego" },
      { name: "San Juan Bautista" }
    ]
  },
  {
    name: "Apure",
    cities: [
      { name: "San Fernando de Apure" },
      { name: "Elorza" },
      { name: "Guasdualito" },
      { name: "Achaguas" }
    ]
  },
  {
    name: "Cojedes",
    cities: [
      { name: "San Carlos" },
      { name: "Tinaquillo" },
      { name: "El Baúl" }
    ]
  },
  {
    name: "Guárico",
    cities: [
      { name: "San Juan de los Morros" },
      { name: "Valle de la Pascua" },
      { name: "Calabozo" },
      { name: "Altagracia de Orituco" },
      { name: "Zaraza" }
    ]
  },
  {
    name: "Delta Amacuro",
    cities: [
      { name: "Tucupita" },
      { name: "Pedernales" }
    ]
  },
  {
    name: "Amazonas",
    cities: [
      { name: "Puerto Ayacucho" },
      { name: "San Fernando de Atabapo" }
    ]
  },
  {
    name: "La Guaira",
    cities: [
      { name: "La Guaira" },
      { name: "Catia La Mar" },
      { name: "Maiquetía" },
      { name: "Macuto" },
      { name: "Caraballeda" },
      { name: "Naiguatá" }
    ]
  }
];
