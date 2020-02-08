const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require("pg");

const pool = new Pool({
  user: "vagrant",
  password: "123",
  host: "localhost",
  database: "lightbnb"
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const tempQuery = `
    SELECT *
    FROM users
    WHERE email = $1
  `;
  console.log("getUserWithEmail", email);
  if (!email) {
    return Promise.reject(null);
  } else {
    return pool
      .query(tempQuery, [email])
      .then(res => res.rows)
      .catch(err => {
        console.log(err);
        return null;
      });
  }
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const tempQuery = `
    SELECT *
    FROM users
    WHERE id = $1
  `;
  console.log("getUserWithEmail", id);
  if (!id) {
    return Promise.reject("Missing id");
  } else {
    return pool
      .query(tempQuery, [id])
      .then(res => {
        console.log("getUserWithId", res);
        return res.rows;
      })
      .catch(err => {
        console.log(err);
        return null;
      });
  }
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  const { name, password, email } = user;
  const tempQuery = `
    INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING *`;

  if (!(name && password && email)) {
    return Promise.reject("Missing name, password, or email");
  } else {
    getUserWithEmail(email)
      .then(result => {
        if (result.length) {
          return pool
            .query(tempQuery, [name, email, password])
            .then(res => res.rows)
            .catch(err => {
              console.log(err);
              return null;
            });
        } else {
          return "User already exists";
        }
      })
      .catch(err => err);
  }
  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const tempQuery = `
    SELECT * FROM reservations
    WHERE guest_id = $1;`;

  if (!(guest_id, limit)) {
    return Promise.reject("Missing guest_id or limit");
  } else {
    return pool
      .query(tempQuery, [limit])
      .then(res => {
        console.log("getAllReservations", res);
        return res.rows;
      })
      .catch(err => {
        console.log(err);
        return null;
      });
  }
  // return getAllProperties(null, 2);
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (
    options.city ||
    options.owner_id ||
    options.minimum_rating ||
    (options.minimum_price_per_night && maximum_price_per_night)
  ) {
    queryString += `WHERE `;

    if (options.city) {
      queryParams.push(`%${options.city}%`);
      queryString += `city LIKE $${queryParams.length} `;
    }

    if (options.owner_id) {
      if (queryParams.length) {
        queryString += `AND `;
      }
      queryParams.push(`%${options.owner_id}%`);
      queryString += `owner_id = $${queryParams.length} `;
    }

    if (options.minimum_rating) {
      if (queryParams.length) {
        queryString += `AND `;
      }
      queryParams.push(`%${options.minimum_rating}%`);
      queryString += `minimum_rating >= $${queryParams.length} `;
    }

    if (options.minimum_price_per_night && options.maximum_price_per_night) {
      if (queryParams.length) {
        queryString += `AND `;
      }
      queryParams.push(`%${options.minimum_rating}%`);
      queryString += `minimum_price_per_night >= $${queryParams.length} `;

      queryParams.push(`%${options.maximum_price_per_night}%`);
      queryString += `AND maximum_price_per_night <= $${queryParams.length} `;
    }
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams).then(res => res.rows);
};
exports.getAllProperties = getAllProperties;

// const limitedProperties = {};
// for (let i = 1; i <= limit; i++) {
//   limitedProperties[i] = properties[i];
// }
// return Promise.resolve(limitedProperties);

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const {
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms
  } = property;

  const queryParams = [
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms
  ];

  let queryString = `
  INSERT INTO properties (
    title, description, owner_id, cover_photo_url, thumbnail_photo_url, 
    cost_per_night, parking_spaces, number_of_bathrooms, 
    number_of_bedrooms, active, province, city, country, 
    street, post_code
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15); 
  `;

  propertyProperties.forEach(element => {
    queryParams.push(property[element]);
  });

  return pool.query(queryString, queryParams).then(res => res.rows);
};
exports.addProperty = addProperty;
