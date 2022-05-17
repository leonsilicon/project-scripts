import { join } from 'desm';
import { execa, execaCommand } from 'execa';
import { globbySync } from 'globby';
import * as fs from 'node:fs';
import * as path from 'node:path';

const projectsDir = join(import.meta.url, '../../..');
process.chdir(projectsDir);

console.log('Finding all package.json files...');
const gitRepos = globbySync('**/.git', {
	gitignore: true,
	ignoreFiles: ['**/node_modules', '**/.pnpm'],
});
fs.writeFileSync(join(import.meta.url, 'repos.json'), JSON.stringify(gitRepos));

await Promise.all(
	gitRepos
		.filter((gitRepo) => !gitRepo.includes('node_modules'))
		.map(async (gitRepo) => {
			await execa('git', ['reset', '--hard'], {
				cwd: path.dirname(gitRepo),
				reject: false,
			});

			const packageJsonFiles = globbySync('**/package.json', { cwd: gitRepo });
			for (const packageJsonFile of packageJsonFiles) {
				try {
					console.log(`Processing package.json file ${packageJsonFile}`);

					const pkgJson = JSON.parse(
						await fs.promises.readFile(packageJsonFile, 'utf8')
					);

					if (pkgJson.dependencies?.['lion-system'] !== undefined) {
						delete pkgJson.dependencies['lion-system'];
					}

					if (pkgJson.devDependencies?.['lion-system'] !== undefined) {
						delete pkgJson.devDependencies['lion-system'];
					}

					await fs.promises.writeFile(
						packageJsonFile,
						JSON.stringify(pkgJson, null, '\t')
					);
				} catch {}
			}

			const cwd = path.dirname(gitRepo);

			await execaCommand(
				"rg lion-system --files-with-matches | xargs sed -i '' 's/lion-system/lionconfig/g'",
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
				['commit', '-m', 'refactor: remove lion-system', '--no-verify'],
				{
					reject: false,
					cwd,
					stdio: 'inherit',
				}
			);
			await execa('git', ['push', '--no-verify']);
		})
);
