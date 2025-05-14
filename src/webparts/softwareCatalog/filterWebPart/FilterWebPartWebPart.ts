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
    };
  }
}

export interface IFilterWebPartProps {}

interface ISoftwareItem {
  Category: string;
  Manufacturer: string;
  Status: string;
}

export default class FilterWebPart extends BaseClientSideWebPart<IFilterWebPartProps> {
  private sp: SPFI;

  public async onInit(): Promise<void> {
    await super.onInit();
    this.sp = getSP(this.context);
    window.selectedFilters = { category: '', manufacturer: '', status: '' };
  }

  public async render(): Promise<void> {
    try {
      const items: ISoftwareItem[] = await this.sp.web.lists
        .getByTitle("Software List Temp")
        .items
        .select("Category", "Manufacturer", "Status")
        .top(4999)();

      const uniqueCategories = Array.from(new Set(items.map(i => i.Category)));
      const uniqueManufacturers = Array.from(new Set(items.map(i => i.Manufacturer)));
      const uniqueStatuses = Array.from(new Set(items.map(i => i.Status)));

      this.domElement.innerHTML = `
        <style>
          .filter-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
            margin-bottom: 16px;
          }

          .filter-bar label {
            font-weight: 600;
            margin-right: 4px;
            white-space: nowrap;
          }

          .filter-bar select {
            padding: 6px 10px;
            border-radius: 6px;
            border: 1px solid #ccc;
            min-width: 140px;
            font-size: 14px;
          }

          @media (max-width: 600px) {
            .filter-bar {
              flex-direction: column;
              align-items: stretch;
            }

            .filter-bar label {
              margin-bottom: 4px;
            }
          }
        </style>

        <div class="filter-bar">
          <label>Category:</label>
          <select id="categoryFilter">
            <option value="">All</option>
            ${uniqueCategories.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>

          <label>Vendor:</label>
          <select id="manufacturerFilter">
            <option value="">All</option>
            ${uniqueManufacturers.map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>

          <label>Status:</label>
          <select id="statusFilter">
            <option value="">All</option>
            ${uniqueStatuses.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
      `;

      this.domElement.querySelectorAll("select").forEach(dropdown => {
        dropdown.addEventListener("change", () => {
          window.selectedFilters = {
            category: (document.getElementById("categoryFilter") as HTMLSelectElement).value,
            manufacturer: (document.getElementById("manufacturerFilter") as HTMLSelectElement).value,
            status: (document.getElementById("statusFilter") as HTMLSelectElement).value
          };
          window.dispatchEvent(new Event("filtersChanged"));
        });
      });

    } catch (error) {
      this.domElement.innerHTML = `<p style="color:red;">⚠️ Unable to load filters. Check list name or access.</p>`;
    }
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }
}
