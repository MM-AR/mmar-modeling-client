import { FetchHelper } from './fetchHelper';
import { GlobalDefinition } from 'resources/global_definitions';
import { UUID } from '../../../../mmar-global-data-structure';
import { singleton } from 'aurelia';
import { Logger } from './logger';

@singleton()
export class FileUtility {

    constructor(
        private globalObjectInstance: GlobalDefinition,
        private logger: Logger,
        private fetchHelper: FetchHelper
    ) { }

    async addFile(uuid: UUID, content: string) {
        // Check if the file already exists
        if (this.globalObjectInstance.localFiles.has(uuid)) {
            this.logger.log(`File with UUID ${uuid} already exists. Overwriting...`, 'warn');
        }
        else {
            this.logger.log(`Adding new file with UUID ${uuid}.`, 'info');
        }
        this.globalObjectInstance.localFiles.set(uuid, content);
    }

    async getFile(uuid: UUID): Promise<string | undefined> {
        this.logger.log(`Retrieving file with UUID ${uuid}.`, 'info');

        if (this.globalObjectInstance.localFiles.has(uuid)) {
            this.logger.log(`File with UUID ${uuid} found in local storage.`, 'info');
            return this.globalObjectInstance.localFiles.get(uuid);
        }
        else {
            // If the file is not found in local storage, fetch it from the server
            this.logger.log(`File with UUID ${uuid} not found in local storage. Fetching from server...`, 'warn');
            const file = await this.fetchHelper.getFileByUUID(uuid);

            //convert the file to a string
            let str: string;
            if (file.type.includes('model/gltf+json') || file.type.includes('application/octet-stream')) {
                str = await file.text();
            } else {
                str = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = typeof reader.result === 'string' ? reader.result : '';
                        resolve(result);
                    };
                    reader.onerror = (error) => {
                        reject(error);
                    };
                    reader.readAsDataURL(file);
                });
            }
            this.addFile(uuid, str);
            this.logger.log(`File with UUID ${uuid} fetched from server and added to local storage.`, 'info');
            return str;
        }
        return undefined;
    }
}