nfs = require "fs"

dir = (__dirname.slice 0, __dirname.indexOf "Omnibot\\") + "Omnibot"
process.chdir dir

describe "fs.",  ->

    fs = require dir + "/lib/core/fs.js"

    fileContents = nfs.readFileSync "package.json", "utf8"

    describe "tryReadSync", ->
        completed = false

        it "should load files just as the native fs does", ->
            fs.tryReadSync "package.json", "utf8", ( contents ) ->
                completed = true
                expect(contents).toEqual fileContents

        it "should be synchronous", ->
            expect(completed).toEqual true

    describe "moveSync", ->
        completed = false
        movedBack = false

        it "should work the same as move", ->
            fs.moveSync "package.json", "lib/package.json"
            completed = true
            expect(nfs.readFileSync "lib/package.json", "utf8").toEqual fileContents

            runs ->
                fs.move "lib/package.json", "package.json", -> movedBack = true

            waitsFor (-> movedBack), "the file should be moved back", 1000

            runs -> expect(nfs.readFileSync "package.json", "utf8").toEqual fileContents

        it "should be synchronous", ->
            expect(completed).toEqual true