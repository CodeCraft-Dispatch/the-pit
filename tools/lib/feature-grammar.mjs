export function parseFeatureDocument(source) {
  const lines = source.split(/\r?\n/);
  let feature = null;
  let currentScenario = null;
  const scenarios = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    if (line.startsWith('Feature:')) {
      feature = line.slice('Feature:'.length).trim();
      continue;
    }

    if (line.startsWith('Scenario:')) {
      currentScenario = {
        name: line.slice('Scenario:'.length).trim(),
        given: 0,
        when: 0,
        then: 0,
        and: 0,
        but: 0
      };
      scenarios.push(currentScenario);
      continue;
    }

    if (!currentScenario) {
      continue;
    }

    if (line.startsWith('Given ')) {
      currentScenario.given += 1;
      continue;
    }

    if (line.startsWith('When ')) {
      currentScenario.when += 1;
      continue;
    }

    if (line.startsWith('Then ')) {
      currentScenario.then += 1;
      continue;
    }

    if (line.startsWith('And ')) {
      currentScenario.and += 1;
      continue;
    }

    if (line.startsWith('But ')) {
      currentScenario.but += 1;
    }
  }

  return {
    feature,
    scenarios
  };
}

export function validateFeatureDocument(source, options = {}) {
  const path = options.path ?? '(inline feature)';
  const document = parseFeatureDocument(source);
  const errors = [];

  if (!document.feature) {
    errors.push(`${path}: missing Feature title`);
  }

  if (document.scenarios.length === 0) {
    errors.push(`${path}: must define at least one Scenario`);
  }

  for (const scenario of document.scenarios) {
    if (!scenario.name) {
      errors.push(`${path}: scenario is missing a title`);
    }

    if (scenario.given === 0) {
      errors.push(`${path}: scenario "${scenario.name}" is missing a Given step`);
    }

    if (scenario.when === 0) {
      errors.push(`${path}: scenario "${scenario.name}" is missing a When step`);
    }

    if (scenario.then === 0) {
      errors.push(`${path}: scenario "${scenario.name}" is missing a Then step`);
    }
  }

  return {
    document,
    errors,
    isValid: errors.length === 0
  };
}
