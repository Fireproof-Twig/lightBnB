const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
  .query('SELECT * FROM users WHERE email = $1', [email])
  .then((result) => {
    console.log(result.rows[0])
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
    return null;
  })
  // let user;
  // for (const userId in users) {
  //   user = users[userId];
  //   if (user.email.toLowerCase() === email.toLowerCase()) {
  //     break;
  //   } else {
  //     user = null;
  //   }
  // }
  // return Promise.resolve(user);
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
  .query('SELECT * FROM users WHERE id = $1', [id])
  .then((result) => {
    console.log(result.rows[0])
    return result.rows[0]
  })
  .catch((err) => {
    console.log(err.message);
    return null;
  })
  // return Promise.resolve(users[id]);
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
  .query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *', [user.name, user.email, user.password])
  .then((result) => {
    console.log(result.rows[0])
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  })
  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
  .query('SELECT reservations.id, properties.title, properties.cost_per_night, reservations.start_date, avg(rating) as average_rating FROM reservations JOIN properties ON reservations.property_id = properties.id JOIN property_reviews ON properties.id = property_reviews.property_id WHERE reservations.guest_id = $1 GROUP BY properties.id, reservations.id ORDER BY reservations.start_date LIMIT $2', [guest_id, limit])
  .then((result) => {
    return result.rows
  })
  .catch((err) => {
    console.log(err.message);
  })
  // return getAllProperties(null, 2);
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{city: string, owner_id: number, minimum_price_per_night string, maximum_price_per_night: string, rating: number}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
 const getAllProperties = (options, limit = 10) => {
  const queryParams = [];
  console.log(options)

  let queryString = `SELECT properties.id, title, cost_per_night, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    if (queryParams.length === 0) {
    queryParams.push(options.owner_id)
    queryString += `WHERE owner_id = $${queryParams.length} `;
    }
    else {
      queryParams.push(options.owner_id)
      queryString += `AND owner_id = $${queryParams.length} `;
    }
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    options.minimum_price_per_night *= 100;
    options.maximum_price_per_night *= 100;
    if (queryParams.length === 0) {
    queryParams.push((options.minimum_price_per_night), (options.maximum_price_per_night))
    queryString += `WHERE cost_per_night >= $${queryParams.length -1}   AND cost_per_night <= $${queryParams.length} `;
    }
    else {
    queryParams.push(options.minimum_price_per_night, options.maximum_price_per_night)
    queryString += `AND cost_per_night >= $${queryParams.length -1} AND cost_per_night <= $${queryParams.length} `;
    }
  }

  if (options.minimum_rating) {
    if (queryParams.length === 0) {
    queryParams.push(options.minimum_rating)
    queryString += `WHERE rating >= $${queryParams.length} `;
    }
    else {
      queryParams.push(options.minimum_rating)
      queryString += `AND rating >= $${queryParams.length} `;
    }
  }

  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{owner_id: int, title: string, description: string, thumbnail_photo_url: string, cover_photo_url: string, cost_per_night: string, street: string, city: string, province: string, post_code: string, country: string, parking_spaces: int, number_of_bathrooms: int, number_of_bedrooms: int}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  return pool
  .query('INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *', [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url,property.cost_per_night, property. street, property.city, property.province, property.post_code, property.country,property.parking_spaces, property. number_of_bathrooms, property.number_of_bedrooms])
  .then((result) => {
    console.log(result.rows[0])
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  })
  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);
}
exports.addProperty = addProperty;
