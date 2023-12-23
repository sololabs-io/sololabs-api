export class SimplePageToken {
    index: number;
    pageSize: number;

    constructor(index: number, pageSize: number){
        this.index = index;
        this.pageSize = pageSize;
    }

    toJSON() {
        return Buffer.from(JSON.stringify({
            index: this.index, 
            pageSize: this.pageSize, 
        })).toString('base64');
    }

    static parse(tokenString?: string): SimplePageToken | undefined {
        if (tokenString == undefined) return undefined;

        try {
            const pageToken:SimplePageToken = JSON.parse(Buffer.from(tokenString, 'base64').toString('ascii'));
            return pageToken;
        }
        catch (error){
            console.error(error);
        }

        return undefined;
    }
}