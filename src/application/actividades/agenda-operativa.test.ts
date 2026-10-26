import test from "node:test";
import assert from "node:assert/strict";
import {consultarAgendaOperativa,type LecturaAgendaOperativa} from "./agenda-operativa.ts";
import type {Actor} from "../../domain/rbac.ts";
test("agenda autoriza antes de leer, limita rango y transmite alcance own",async()=>{let calls=0;let received="";const repo:LecturaAgendaOperativa={async listar(_actor,scope){calls++;received=scope;return [];}};const actor:Actor={userId:2,roleSlug:"broker",permissions:[{resource:"activities",action:"view",scope:"own"}]};const desde=new Date("2026-10-01T00:00:00Z"),hasta=new Date("2026-11-01T00:00:00Z");await assert.rejects(()=>consultarAgendaOperativa(repo,{...actor,permissions:[]},desde,hasta));assert.equal(calls,0);await assert.rejects(()=>consultarAgendaOperativa(repo,actor,desde,new Date("2027-01-01")));assert.equal(calls,0);await consultarAgendaOperativa(repo,actor,desde,hasta);assert.equal(received,"own");assert.equal(calls,1);});
