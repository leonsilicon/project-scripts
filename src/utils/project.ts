import * as path from 'node:path';

import { projectsDir } from '~/utils/paths.js';

export function getProjectDir({ projectName }: { projectName: string }) {
	return path.join(projectsDir, projectName);
}
