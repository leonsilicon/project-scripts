import { join } from 'desm';
import { execa } from 'execa';
import fs from 'node:fs';
import path from 'node:path';

const projectsDir = join(import.meta.url, '../../..');
const projectDirs = fs.readdirSync(projectsDir);
await Promise.all(
	projectDirs.map(async (projectDirName) => {
		const projectDir = path.join(projectsDir, projectDirName);
		const pkgJsonPath = path.join(projectDir, 'package.json');
		const cwd = projectDir;
		if (fs.existsSync(pkgJsonPath)) {
			try {
				await execa('pnpm', ['remove', '@leonzalion/configs'], {
					reject: false,
					stdio: 'inherit',
					cwd,
				});
				await execa('pnpm', ['remove', 'lionconfig'], {
					reject: false,
					stdio: 'inherit',
					cwd,
				});
				await execa('pnpm', ['add', '-D', 'lionconfig'], {
					reject: false,
					stdio: 'inherit',
					cwd,
				});
				await execa('pnpm', ['add', '-w', '-D', 'lionconfig'], {
					reject: false,
					stdio: 'inherit',
					cwd,
				});

				if (fs.existsSync(path.join(projectDir, '.eslintrc.cjs'))) {
					let eslint = fs.readFileSync(
						path.join(projectDir, '.eslintrc.cjs'),
						'utf8'
					);
					eslint = eslint.replace(
						'@leonzalion/configs/eslint.cjs',
						'lionconfig'
					);
					fs.writeFileSync(path.join(projectDir, '.eslintrc.cjs'), eslint);
				}

				if (fs.existsSync(path.join(projectDir, 'tsconfig.json'))) {
					let tsconfig = fs.readFileSync(
						path.join(projectDir, 'tsconfig.json'),
						'utf8'
					);
					tsconfig = tsconfig.replace(
						'@leonzalion/configs/tsconfig.json',
						'lionconfig/tsconfig.json'
					);
					fs.writeFileSync(path.join(projectDir, 'tsconfig.json'), tsconfig);
				}

				await execa('git', ['add', '.'], { stdio: 'inherit', cwd });
				await execa('git', ['commit', '-m', 'chore: fix script'], {
					stdio: 'inherit',
					cwd,
				});
				await execa('git', ['push', '--no-verify'], { stdio: 'inherit', cwd });
			} catch (error) {
				console.error(error);
			}
		}
	})
);
