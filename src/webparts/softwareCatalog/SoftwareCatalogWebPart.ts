import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { getSP } from "../../pnpjsConfi";

declare global {
  interface Window {
    selectedFilters: {
      category: string;
      manufacturer: string;
      status: string;
      searchText: string;
    };
    currentTheme: 'light' | 'dark';
  }
}

export interface ICatalogDisplayWebPartProps {}

interface ISoftwareItem {
  Title: string;
  Category: string;
  Status: string;
  Manufacturer: string;
  Image?: { Url: string };
  ManufacturerURL?: { Url: string };
  Description?: string;
}

export default class CatalogDisplayWebPart extends BaseClientSideWebPart<ICatalogDisplayWebPartProps> {
  private sp: SPFI;

  public async onInit(): Promise<void> {
    await super.onInit();
    this.sp = getSP(this.context);
    window.addEventListener("filtersChanged", () => void this.render());
    window.addEventListener("themeChanged", () => void this.render());
  }

  public async render(): Promise<void> {
    const filters = window.selectedFilters ?? { category: '', manufacturer: '', status: '', searchText: '' };
    const search = filters.searchText?.toLowerCase() || '';

    const items: ISoftwareItem[] = await this.sp.web.lists
      .getByTitle("Software List Temp")
      .items
      .select("Title", "Category", "Status", "Manufacturer", "Image", "ManufacturerURL", "Description")
      .top(4999)();

    const filtered = (!filters.category && !filters.manufacturer && !filters.status && !search)
      ? items
      : items.filter(item => {
          const title = item.Title?.toLowerCase() || '';
          const titleMatch = title.includes(search);
          return titleMatch &&
            (!filters.category || item.Category === filters.category) &&
            (!filters.manufacturer || item.Manufacturer === filters.manufacturer) &&
            (!filters.status || item.Status === filters.status);
        });

    if (filtered.length === 0) {
      this.domElement.innerHTML = `<p style="padding:20px; text-align:center; color:#666;">No matching software found.</p>`;
      return;
    }

    this.domElement.innerHTML = `
      <style>
        :root {
          --bg: #ffffff;
          --text: #1b1b1b;
          --border: #ccc;
          --pill: #666;
        }
        .dark-mode {
          --bg: #1c1c1c;
          --text: #eeeeee;
          --border: #555;
          --pill: #999;
        }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }
        .card {
          border: 1px solid var(--border);
          padding: 16px;
          border-radius: 12px;
          background: var(--bg);
          color: var(--text);
          box-shadow: 0 2px 5px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .card img {
          height: 100px;
          width: 100%;
          object-fit: contain;
          margin-bottom: 12px;
        }
        .card h3 {
          margin: 0;
          font-size: 18px;
        }
        .card p {
          margin: 4px 0;
        }
        .status-pill {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          display: inline-block;
          margin-top: 8px;
          color: white;
          background-color: var(--pill);
        }
        .status-Approved { background-color: #28a745; }
        .status-Pending { background-color: #ffc107; color: black; }
        .status-Rejected, .status-InReview { background-color: #dc3545; }
        .card a.vendor-link {
          margin-top: 8px;
          font-size: 13px;
          color: var(--text);
          text-decoration: underline;
        }
      </style>

      <div class="${window.currentTheme === 'dark' ? 'dark-mode' : ''}">
        <div class="card-grid">
          ${filtered.map(item => `
            <div class="card">
              <img src="${item.Image?.Url || 'https://via.placeholder.com/150?text=No+Logo'}" alt="${item.Title}" />
              <h3>${item.Title}</h3>
              <p>${item.Manufacturer}</p>
              <span class="status-pill status-${item.Status.replace(/\s+/g, '')}">${item.Status}</span>
              ${item.ManufacturerURL?.Url ? `<a class="vendor-link" href="${item.ManufacturerURL.Url}" target="_blank">Visit Website</a>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }
}
