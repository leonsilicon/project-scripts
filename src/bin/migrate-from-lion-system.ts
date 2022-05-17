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

			await execa('git', ['reset', '--hard'], {
				cwd: projectDir,
				reject: false,
			});

			const packageJsonFiles = globbySync('**/package.json', {
				cwd: projectDir,
			});

			for (const packageJsonFileName of packageJsonFiles) {
				const packageJsonFile = path.join(projectDir, packageJsonFileName);
				if (packageJsonFile.includes('node_modules')) continue;

				console.log(`Processing package.json file ${packageJsonFile}`);

				const pkgJson = JSON.parse(
					await fs.promises.readFile(packageJsonFile, 'utf8')
				);

				if (pkgJson.dependencies?.['lionconfig'] !== undefined) {
					delete pkgJson.dependencies['lionconfig'];
				}

				if (pkgJson.devDependencies?.['lionconfig'] !== undefined) {
					delete pkgJson.devDependencies['lionconfig'];
				}

				await fs.promises.writeFile(
					packageJsonFile,
					JSON.stringify(pkgJson, null, '\t')
				);
			}

			const cwd = projectDir;

			await execaCommand(
				"rg lionconfig --files-with-matches | xargs sed -i '' 's/lionconfig/lionconfig/g'",
				{ cwd, shell: true, reject: false, stdio: 'inherit' }
			);

			await execa('pnpm', ['install'], {
				reject: false,
				cwd,
				stdio: 'inherit',
			});
			await execa('pnpm', ['up', 'lionconfig'], {
				reject: false,
				cwd,
				stdio: 'inherit',
			});

			await execa('git', ['add', '.'], {
				reject: false,
				cwd,
				stdio: 'inherit',
			});
			await execa(
				'git',
				['commit', '-m', 'refactor: remove lionconfig', '--no-verify'],
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
