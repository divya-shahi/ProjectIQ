
export function calculateCriticalPath(tasks) {
  const taskMap = new Map(
    tasks.map(task => [
      String(task._id),
      {
        id: String(task._id),
        title: task.title,
        duration: Number(task.estimatedDuration) || 1,
        dependencies: (task.dependencies || []).map(dep =>
          String(dep._id || dep)
        )
      }
    ])
  );

  const inDegree = new Map();
  const successors = new Map();

  for (const task of taskMap.values()) {
    inDegree.set(task.id, task.dependencies.length);
    successors.set(task.id, []);
  }

  for (const task of taskMap.values()) {
    for (const dependencyId of task.dependencies) {
      if (!taskMap.has(dependencyId)) {
        throw new Error("A dependency task was not found");
      }

      successors.get(dependencyId).push(task.id);
    }
  }

  // Topological sorting
  const queue = [];

  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted = [];

  while (queue.length > 0) {
    const id = queue.shift();
    sorted.push(id);

    for (const nextId of successors.get(id)) {
      inDegree.set(nextId, inDegree.get(nextId) - 1);

      if (inDegree.get(nextId) === 0) {
        queue.push(nextId);
      }
    }
  }

  if (sorted.length !== tasks.length) {
    throw new Error("Circular dependencies detected");
  }

  // Forward pass
  const schedule = new Map();

  for (const id of sorted) {
    const task = taskMap.get(id);

    const earliestStart = task.dependencies.length
      ? Math.max(
          ...task.dependencies.map(dep =>
            schedule.get(dep).earliestFinish
          )
        )
      : 0;

    const earliestFinish = earliestStart + task.duration;

    schedule.set(id, {
      ...task,
      earliestStart,
      earliestFinish
    });
  }

  const projectDuration = Math.max(
    0,
    ...Array.from(schedule.values()).map(
      task => task.earliestFinish
    )
  );

  // Backward pass
  for (const id of [...sorted].reverse()) {
    const task = schedule.get(id);
    const nextTasks = successors.get(id);

    const latestFinish = nextTasks.length
      ? Math.min(
          ...nextTasks.map(nextId =>
            schedule.get(nextId).latestStart
          )
        )
      : projectDuration;

    const latestStart = latestFinish - task.duration;
    const totalFloat = latestStart - task.earliestStart;

    schedule.set(id, {
      ...task,
      latestStart,
      latestFinish,
      totalFloat,
      isCritical: totalFloat === 0
    });
  }

  return {
    projectDuration,
    tasks: Array.from(schedule.values()),
    criticalTasks: Array.from(schedule.values()).filter(
      task => task.isCritical
    )
  };
}
