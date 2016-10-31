"use strict";
var Promise_1 = require("./util/Promise");
var HttpRequest_1 = require("./util/HttpRequest");
var PromiseUtil_1 = require("./util/PromiseUtil");
var TextureGroup_1 = require("./core/TextureGroup");
var FlumpMovie_1 = require("./core/FlumpMovie");
var MovieData_1 = require("./data/MovieData");
var QueueItem_1 = require("./util/QueueItem");
/**
 * Structure:
 * FlumpLibrary
 *  - FlumpMovie
 */
var FlumpLibrary = (function () {
    function FlumpLibrary(basePath) {
        this.movieData = [];
        this.textureGroups = [];
        this.fps = 0;
        this.isOptimised = false;
        this._hasLoaded = false;
        this._isLoading = false;
        if (basePath) {
            this.url = basePath;
        }
    }
    FlumpLibrary.load = function (url, library, onProcess) {
        var baseDir = url;
        if (url.indexOf('.json') > -1) {
            baseDir = url.substr(0, url.lastIndexOf('/'));
        }
        else {
            if (baseDir.substr(-1) == '/') {
                baseDir = baseDir.substr(0, baseDir.length - 1);
            }
            url += (url.substr(url.length - 1) != '/' ? '/' : '') + 'library.json';
        }
        if (library == void 0) {
            library = new FlumpLibrary(baseDir);
        }
        else {
            library.url = baseDir;
        }
        return HttpRequest_1.HttpRequest.getJSON(url).then(function (json) { return library.processData(json, onProcess); });
    };
    FlumpLibrary.prototype.hasLoaded = function () {
        return this._hasLoaded;
    };
    FlumpLibrary.prototype.isLoading = function () {
        return this._isLoading;
    };
    FlumpLibrary.prototype.load = function (onProgress) {
        if (this.hasLoaded()) {
            onProgress(1);
            return Promise_1.Promise.resolve(this);
        }
        if (!this.url) {
            throw new Error('url is not set and there for can not be loaded');
        }
        return FlumpLibrary.load(this.url, this, onProgress).catch(function () {
            throw new Error('could not load library');
        });
    };
    FlumpLibrary.prototype.processData = function (json, onProcess) {
        var _this = this;
        this.md5 = json.md5;
        this.frameRate = json.frameRate;
        this.referenceList = json.referenceList || null;
        this.isOptimised = json.optimised || false;
        var textureGroupLoaders = [];
        for (var i = 0; i < json.movies.length; i++) {
            var movieData = new MovieData_1.MovieData(this, json.movies[i]);
            this.movieData.push(movieData);
        }
        var textureGroups = json.textureGroups;
        for (var i = 0; i < textureGroups.length; i++) {
            var textureGroup = textureGroups[i];
            var promise = TextureGroup_1.TextureGroup.load(this, textureGroup);
            textureGroupLoaders.push(promise);
        }
        return PromiseUtil_1.PromiseUtil.wait(textureGroupLoaders, onProcess)
            .then(function (textureGroups) {
            for (var i = 0; i < textureGroups.length; i++) {
                var textureGroup = textureGroups[i];
                _this.textureGroups.push(textureGroup);
            }
            _this._hasLoaded = true;
            return _this;
        });
    };
    FlumpLibrary.prototype.getMovieData = function (name) {
        for (var i = 0; i < this.movieData.length; i++) {
            var movieData = this.movieData[i];
            if (movieData.id == name) {
                return movieData;
            }
        }
        throw new Error('movie not found');
    };
    FlumpLibrary.prototype.createSymbol = function (name, paused) {
        if (paused === void 0) { paused = false; }
        for (var i = 0; i < this.textureGroups.length; i++) {
            if (this.textureGroups[i].hasSprite(name)) {
                return this.textureGroups[i].createSprite(name);
            }
        }
        for (var i = 0; i < this.movieData.length; i++) {
            var movieData = this.movieData[i];
            if (movieData.id == name) {
                var movie = new FlumpMovie_1.FlumpMovie(this, name);
                movie.getQueue().add(new QueueItem_1.QueueItem(null, 0, movie.frames, -1, 0));
                movie.paused = paused;
                return movie;
            }
        }
        console.warn('no _symbol found: (' + name + ')');
        throw new Error("no _symbol found");
    };
    FlumpLibrary.prototype.createMovie = function (id) {
        var name;
        // if(this.referenceList)
        // {
        // 	name = this.referenceList.indexOf(<number> id);
        // }
        // else
        // {
        name = id;
        // }
        for (var i = 0; i < this.movieData.length; i++) {
            var movieData = this.movieData[i];
            if (movieData.id == name) {
                var movie = new FlumpMovie_1.FlumpMovie(this, name);
                movie.paused = true;
                return movie;
            }
        }
        console.warn('no _symbol found: (' + name + ') ', this);
        throw new Error("no _symbol found: " + this);
    };
    FlumpLibrary.prototype.getNameFromReferenceList = function (value) {
        if (this.referenceList && typeof value == 'number') {
            return this.referenceList[value];
        }
        return value;
    };
    FlumpLibrary.EVENT_LOAD = 'load';
    return FlumpLibrary;
}());
exports.FlumpLibrary = FlumpLibrary;
