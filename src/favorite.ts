import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { v4 as uuidv4 } from 'uuid';

/**
 * Favorite object.
 */
export class Favorite {
    kind: FavoriteKind; // Type of Favorite: Group, Favorite potentially more
    resourcePath: string; // Path to the resource
    label: string; // User given label
    uuid: string; // Unique ID for the for this resource
    children: Favorite[] = []; // When a group, Favorites linked to the group
    parent?: string; // Uuid of the parent Favorite

    /**
     * @returns An additional description for the Favorite to be displayed in quick pick items (only if the Favorite has a user defined label)
     */
    get description(): string | undefined {
        return this.label !== this.resourcePath ? this.resourcePath : undefined;
    }

    /**
     * @returns an URI object poiting to the underlying fs resource
     */
    get resourceUri(): Uri {
        return Uri.file(this.resourcePath);
    }

    /**
     * Creates a new Favorite object of kind Undefined and generates a new UUID for it.
     */
    constructor() {
        this.uuid = uuidv4();
        this.kind = FavoriteKind.Undefined;
        this.resourcePath = '';
        this.label = '';
    }

    /**
     * Converts this Favorite to a Partial Favorite (used for Quick Picks);
     * @param parent The parent Favorite
     */
    toPartial(parent?: Favorite): PartialFavorite {
        return {
            label: parent ? `[ ${parent.label} ] ${this.label}` : this.label,
            description: this.description,
            resourceUri: this.resourceUri,
            kind: this.kind
        };
    }

    /**
     * Converts the present Favorite to a TreeItem.
     * @returns A TreeItem object
     */
    toTreeItem(): TreeItem {
        let item: TreeItem = new TreeItem('Undefined', TreeItemCollapsibleState.None);
        switch (this.kind) {
            case FavoriteKind.File:
                item = new TreeItem(this.label, TreeItemCollapsibleState.None);
                item.label = this.label;
                item.resourceUri = this.resourceUri;
                item.iconPath = ThemeIcon.File;
                item.tooltip = this.resourcePath;
                item.command = {
                    command: 'fav.context.openResource',
                    arguments: [item.resourceUri],
                    title: 'Open Favorite'
                };
                break;

            case FavoriteKind.Group:
                item = new TreeItem(this.label, TreeItemCollapsibleState.Collapsed);
                item.label = this.label;
                item.iconPath = ThemeIcon.Folder;
                item.contextValue = 'group';
                break;
            default:
                break;
        }
        return item;
    }

    /**
     * Compare this Favorite to another one.
     * Favorites are always compared using their labels. 
     * If a group is compared with a standard Favorite, the result will be such that the group will appear first in the sorted result
     * @param other The Favorite to compare to
     */
    compareTo = (other: Favorite | PartialFavorite) => Favorite.comparatorFn(this, other);

    /**
     * A comparator helper, useful for instance to be called in Array.sort() calls.
     * @param a A Favorite
     * @param b Another Favorite
     */
    static comparatorFn(a: Favorite | PartialFavorite, b: Favorite | PartialFavorite) {
        if (a.kind !== b.kind) {
            return FavoriteKind.Group === a.kind ? -1 : 1;
        }

        return a.label.localeCompare(b.label);
    }
}

/**
 * Defines the type of Favorite.
 * If more types to come this will should be replaced by proper object tree.
 */
export enum FavoriteKind {
    Undefined = 0,
    Group, // The favorite is a group which can have children
    File // The favorite points to as single file
}

export interface PartialFavorite {
    label: string,
    description: string | undefined,
    resourceUri: Uri,
    kind: FavoriteKind
}