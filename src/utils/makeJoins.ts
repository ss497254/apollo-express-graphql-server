export function doesPathExist(
    nodes: any,
    paths: string[]
): Record<string, boolean> {
    const result: Record<string, boolean> = {};

    paths.forEach((path: string) => {
        result[path as string] = false;
    });

    if (!nodes) {
        return result;
    }

    if (paths.length === 0) {
        return result;
    }

    nodes.forEach((x: any) => {
        if (paths.includes(x.name.value)) result[x.name.value] = true;
    });

    return result;
}

export function makeJoins(
    PathArray: string[],
    fieldNodes: any
): { shouldJoin: boolean; pathValues: Record<string, boolean> } {
    const pathValues: Record<string, boolean> = doesPathExist(
        fieldNodes[0].selectionSet.selections,
        PathArray
    );

    const shouldJoin = !!PathArray.find((path) => pathValues[path]);

    console.log({ shouldJoin, pathValues });
    return { shouldJoin, pathValues };
}

export function mergePaths(
    pathValues: Record<string, boolean>,
    pathsTobeMerged: Record<string, string[]>
): Record<string, boolean> {
    const result: Record<string, boolean> = {};

    Object.keys(pathsTobeMerged).map((path) => {
        result[path] = pathValues[path];
        pathsTobeMerged[path].forEach(
            (_path) => (result[path] ||= pathValues[_path])
        );
    });

    return result;
}

// console.log(
//     mergePaths(
//         { answer: false, votes: true, voteStatus: false, answerLength: false },
//         {
//             answer: ["answerLength"],
//             votes: ["voteStatus"],
//         }
//     )
// );
