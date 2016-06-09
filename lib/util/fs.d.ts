/// <reference path="../../typings/fs-extra.d.ts" />
declare module "fs-extra" {
    function tryReadSync (filename: string, encoding: string): string;
    function moveSync (source: string, dest: string): string;
}