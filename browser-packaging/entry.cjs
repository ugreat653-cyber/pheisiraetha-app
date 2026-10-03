'use strict';

// Packaging checkpoint only: instantiate the exact frozen modules privately.
// No evaluation, facade, adapter, plan builder, formatter, renderer or wiring.
// These bindings stay inside the generated IIFE; nothing is exported globally.
const analysis = require('./frozen/analysis.js');
const safety = require('./frozen/safety.js');
void analysis;
void safety;
