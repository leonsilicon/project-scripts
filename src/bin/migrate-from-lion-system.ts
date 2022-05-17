import { join } from 'desm';
import { execa, execaCommand } from 'execa';
import { globbySync } from 'globby';
import * as fs from 'node:fs';
import * as path from 'node:path';

const projectsDir = join(import.meta.url, '../../..');
process.chdir(projectsDir);

const projects = fs.readdirSync(projectsDir);

await Promise.all(
	projects.map(async (project) => {
		try {
			const projectDir = path.join(projectsDir, project);
			if (!fs.statSync(projectDir).isDirectory()) {
				return;
			}

			const cwd = projectDir;

			await execa('pnpm', ['install'], {
				reject: false,
				cwd,
				stdio: 'inherit',
			});
			if (fs.existsSync(path.join(cwd, 'pnpm-workspace.yaml'))) {
				await execa('pnpm', ['add', '-D', '-w', 'lionconfig'], {
					reject: false,
					cwd,
					stdio: 'inherit',
				});
				await execa('pnpm', ['up', '-w', 'lionconfig'], {
					reject: false,
					cwd,
					stdio: 'inherit',
				});
			} else {
				await execa('pnpm', ['add', '-D', 'lionconfig'], {
					reject: false,
					cwd,
					stdio: 'inherit',
				});
				await execa('pnpm', ['up', '-D', 'lionconfig'], {
					reject: false,
					cwd,
					stdio: 'inherit',
				});
			}

			await execa('git', ['add', '.'], {
				reject: false,
				cwd,
				stdio: 'inherit',
			});
			await execa(
				'git',
				['commit', '-m', 'refactor: add lionconfig', '--no-verify'],
				{
					reject: false,
					cwd,
					stdio: 'inherit',
				}
			);
			await execa('git', ['push', '--no-verify'], {
				stdio: 'inherit',
				cwd,
				reject: false,
			});
		} catch (error: unknown) {
			console.error(error);
		}
	})
);
