// =========== STORAGE & FETCH UTILITIES ===========

// =========== VERSIONED LOCALSTORAGE ===========
var STORAGE_VERSION = 1;
var STORAGE_PREFIX = 'gp_v' + STORAGE_VERSION + '_';
var OLD_KEYS = ['gp_user', 'gp_cart', 'gp_favorites', 'gp_remember', 'adminTheme'];

var Storage = {
  _memoryCache: new Map(),

  get: function(key) {
    // Check memory cache first
    if (this._memoryCache.has(key)) {
      return this._memoryCache.get(key);
    }

    try {
      var item = localStorage.getItem(STORAGE_PREFIX + key);
      var parsed = item ? JSON.parse(item) : null;

      // Cache the parsed value in memory
      this._memoryCache.set(key, parsed);

      return parsed;
    } catch (e) {
      return null;
    }
  },

  set: function(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));

      // Update memory cache
      this._memoryCache.set(key, value);
    } catch (e) {}
  },

  remove: function(key) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);

      // Remove from memory cache
      this._memoryCache.delete(key);
    } catch (e) {}
  },

  getRaw: function(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },

  removeRaw: function(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  },

  migrateIfNeeded: function() {
    var migrated = this.get('_migrated');
    if (migrated) return;

    // Migrate old keys to new versioned keys
    OLD_KEYS.forEach(function(oldKey) {
      var oldValue = localStorage.getItem(oldKey);
      if (oldValue !== null) {
        var newKey = oldKey.replace('gp_', STORAGE_PREFIX);
        if (!localStorage.getItem(newKey)) {
          localStorage.setItem(newKey, oldValue);
        }
      }
    });

    this.set('_migrated', true);
  },

  clearAll: function() {
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && (key.startsWith(STORAGE_PREFIX) || OLD_KEYS.indexOf(key) !== -1)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(function(key) {
      try { localStorage.removeItem(key); } catch (e) {}
    });

    // Clear memory cache
    this._memoryCache.clear();
  }
};

// Run migration on load
Storage.migrateIfNeeded();

// =========== FETCH DEDUPLICATION ===========
var FetchCache = {
  _cache: new Map(),
  _inflight: new Map(),
  _defaultTTL: 30000, // 30 seconds

  get: function(key) {
    var entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      return null;
    }
    return entry.data;
  },

  set: function(key, data, ttl) {
    this._cache.set(key, {
      data: data,
      expiresAt: Date.now() + (ttl || this._defaultTTL)
    });
  },

  invalidate: function(pattern) {
    if (!pattern) {
      this._cache.clear();
      return;
    }
    var keysToDelete = [];
    this._cache.forEach(function(_, key) {
      if (key.indexOf(pattern) !== -1) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(function(key) {
      this._cache.delete(key);
    }.bind(this));
  },

  // Main fetch function with deduplication and caching
  fetch: function(url, options, ttl) {
    var self = this;
    var cacheKey = url + (options ? JSON.stringify(options) : '');
    var isGet = !options || !options.method || options.method === 'GET';

    // Check cache for GET requests
    if (isGet) {
      var cached = this.get(cacheKey);
      if (cached) {
        return Promise.resolve(cached);
      }

      // Check if request is already in flight
      var inflight = this._inflight.get(cacheKey);
      if (inflight) {
        return inflight;
      }
    }

    // Create new request
    var promise = fetch(url, options)
      .then(function(response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        // Cache successful GET responses
        if (isGet) {
          self.set(cacheKey, data, ttl);
          self._inflight.delete(cacheKey);
        }
        return data;
      })
      .catch(function(error) {
        // Remove from inflight on error
        if (isGet) {
          self._inflight.delete(cacheKey);
        }
        throw error;
      });

    // Track inflight GET requests
    if (isGet) {
      this._inflight.set(cacheKey, promise);
    }

    return promise;
  },

  // Invalidate cache when data changes (POST/PUT/DELETE)
  invalidateOnMutation: function(url) {
    // Extract base path from URL
    var match = url.match(/\/api\/([^/?]+)/);
    if (match) {
      this.invalidate('/api/' + match[1]);
    }
  }
};

// Helper function for easy use
function cachedFetch(url, options, ttl) {
  return FetchCache.fetch(url, options, ttl);
}

function invalidateCache(pattern) {
  FetchCache.invalidate(pattern);
}

// Auto-invalidate cache on mutations
var _originalFetch = window.fetch;
window.fetch = function(url, options) {
  var result = _originalFetch.call(this, url, options);
  var method = (options && options.method) || 'GET';

  if (method !== 'GET' && typeof url === 'string' && url.indexOf('/api/') !== -1) {
    result.then(function() {
      FetchCache.invalidateOnMutation(url);
    }).catch(function() {});
  }

  return result;
};
