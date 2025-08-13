import * as duckdb from 'duckdb';

let _db: duckdb.Database | null = null;
let _httpfsLoaded = false;

export function getDB() {
  if (_db) return _db;
  _db = new duckdb.Database(':memory:');
  return _db;
}

export function getConn() {
  const db = getDB();
  const con = db.connect();
  if (!_httpfsLoaded) {
    try {
      con.run(`INSTALL httpfs; LOAD httpfs;`);
      _httpfsLoaded = true;
    } catch (error) {
      console.warn('Failed to load httpfs extension:', error);
      // Continue without httpfs if it fails
    }
  }
  return con;
}

export function connectAndInit() {
  return getConn();
}

export function releaseConnection(con: duckdb.Connection) {
  try {
    con.close();
  } catch (error) {
    console.warn('Error closing connection:', error);
  }
} 