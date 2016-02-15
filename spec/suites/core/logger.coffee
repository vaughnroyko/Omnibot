nfs = require "fs"

dir = (__dirname.slice 0, __dirname.indexOf "Omnibot\\") + "Omnibot"
process.chdir dir

describe "logger.", ->

    beforeEach ->
        @addMatchers {
            toBeA: (expected) ->
                pass = (typeof @actual) is expected
                unless pass
                    @message = "Expected " + @actual + " to be a " + expected
                return pass
        }

    Logger = require dir + "/lib/core/logger.js"
    logger = undefined

    it "can produce a timestamp", ->
        expect(Logger.getTimestamp).not.toThrow()
        expect(Logger.getTimestamp()).toBeA "string"
        expect(
            Logger.getTimestamp(new Date 'December 17, 1995 03:24:00')
        ).toEqual "1995-12-17 03:24:00"
        expect(
            Logger.getTimestamp(
                new Date('October 1, 2005 16:01:20'),
                "{year} {month} {monthName} {date} {hour} {minute} {second} {anteMeridiem?am:pm} {postMeridiem?pm:am}"
            )
        ).toEqual "2005 10 October 01 16 01 20 am am"

    it "should be instantiable", ->
        logger = new Logger "spec/loggerTest"

    if logger
        it "should produce a log folder", ->
