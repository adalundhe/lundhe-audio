"use client";

import * as React from "react";

import { Accordion } from "~/components/ui/accordion";
import { GearEditorForm } from "./gear-editor-form";
import { GearInventoryTable } from "./gear-inventory-section";
import { GearInventoryDetailsPanel } from "./gear-inventory-details-panel";
import { GearMediaSection } from "./gear-media-section";
import { type GearItem } from "./gear-manager-types";
import { GearPricingSection } from "./gear-pricing-section";
import { GearSelectedTitleHistorySection } from "./gear-selected-title-history-section";
import { GearServiceLogSection } from "./gear-service-log-section";
import { GearSummarySection } from "./gear-summary-section";
import { GearTaxonomySection } from "./gear-taxonomy-section";
import { useGearManager } from "./use-gear-manager";
import { useWishlistGearManager } from "./use-wishlist-gear-manager";
import { WishlistGearInventoryDetailsPanel } from "./wishlist-gear-inventory-details-panel";
import { WishlistGearSection } from "./wishlist-gear-section";
import { type WishlistGearItem } from "./wishlist-gear-manager-types";

export function GearManager({
  initialGear,
  initialWishlist,
  wishlistLoadError,
}: {
  initialGear: GearItem[];
  initialWishlist: WishlistGearItem[];
  wishlistLoadError: string | null;
}) {
  const state = useGearManager({ initialGear });
  const wishlistState = useWishlistGearManager({
    initialWishlist,
    taxonomySeedItems: state.gear,
  });

  return (
    <Accordion
      type="multiple"
      defaultValue={["summary"]}
      className="flex min-w-0 flex-col gap-6"
    >
      <GearSummarySection
        inventorySummary={state.inventorySummary}
        inventoryValueDistributionChartData={
          state.inventoryValueDistributionChartData
        }
        inventoryManufacturerRadialChartData={
          state.inventoryManufacturerRadialChartData
        }
        inventoryValueChartConfig={state.inventoryValueChartConfig}
        spendOverTimeChartData={state.spendOverTimeChartData}
        spendTimelineChartConfig={state.spendTimelineChartConfig}
        spendByGroupAreaChart={state.spendByGroupAreaChart}
        formatCurrency={state.formatCurrency}
        abbreviateCurrency={state.abbreviateCurrency}
        inventorySection={
          <GearInventoryTable
            inventoryTableData={state.inventoryTableData}
            isCreatingInline={state.isCreatingInline}
            openNewRow={state.openNewRow}
            inventoryColumns={state.inventoryColumns}
            selectedInventoryItemId={state.selectedInventoryItemId}
            handleSelectRow={state.handleSelectRow}
            inventoryFilterTabs={state.inventoryFilterTabs}
            renderExpandedInventoryRow={(item: GearItem) => {
              const liveItem =
                state.gear.find((gearItem) => gearItem.id === item.id) ?? item;

              return (
              <GearInventoryDetailsPanel
                item={liveItem}
                editorSection={
                  state.isCreatingInline || state.form.id === liveItem.id ? (
                    <GearEditorForm
                      isEditing
                      form={state.form}
                      setForm={state.setForm}
                      error={state.error}
                      handleSubmit={state.handleSubmit}
                      handleClearForm={state.handleClearForm}
                      isFormComplete={state.isFormComplete}
                      upsertMutation={state.upsertMutation}
                      availableManufacturerGroups={state.availableManufacturerGroups}
                      availableGearTypes={state.availableGearTypes}
                      availableGearGroups={state.availableGearGroups}
                      setCustomManufacturers={state.setCustomManufacturers}
                      setCustomGearTypes={state.setCustomGearTypes}
                      setCustomGearGroups={state.setCustomGearGroups}
                      mergeUniqueOptions={state.mergeUniqueOptions}
                      handleNumberInputWheel={state.handleNumberInputWheel}
                      showActions={false}
                      pricingSection={
                        <GearPricingSection
                          pricingError={state.pricingError}
                          priceGuideMatches={state.priceGuideMatches}
                          priceGuideColumns={state.priceGuideColumns}
                          priceGuideTableResetKey={state.priceGuideTableResetKey}
                          priceGuideFilterTabs={state.priceGuideFilterTabs}
                          selectedPriceGuideIds={state.selectedPriceGuideIds}
                          selectedPriceGuideCount={state.selectedPriceGuideCount}
                          selectedAveragePrice={state.selectedAveragePrice}
                          handleApplyAveragePrice={state.handleApplyAveragePrice}
                          handleTogglePriceGuide={state.handleTogglePriceGuide}
                          formatCurrency={state.formatCurrency}
                          historySection={
                            <GearSelectedTitleHistorySection
                              selectedTitleQueries={state.selectedTitleQueries}
                              availableModelHistorySourceOptions={
                                state.availableModelHistorySourceOptions
                              }
                              resolvedVisibleModelHistorySources={
                                state.resolvedVisibleModelHistorySources
                              }
                              setVisibleModelHistorySources={
                                state.setVisibleModelHistorySources
                              }
                              availableModelHistoryTitleOptions={
                                state.availableModelHistoryTitleOptions
                              }
                              resolvedVisibleModelHistoryTitleKeys={
                                state.resolvedVisibleModelHistoryTitleKeys
                              }
                              setVisibleModelHistoryTitleKeys={
                                state.setVisibleModelHistoryTitleKeys
                              }
                              availableModelHistorySeriesOptions={
                                state.availableModelHistorySeriesOptions
                              }
                              resolvedVisibleModelHistoryModelKeys={
                                state.resolvedVisibleModelHistoryModelKeys
                              }
                              setVisibleModelHistoryModelKeys={
                                state.setVisibleModelHistoryModelKeys
                              }
                              availableModelHistoryManufacturerOptions={
                                state.availableModelHistoryManufacturerOptions
                              }
                              resolvedVisibleModelHistoryManufacturerKeys={
                                state.resolvedVisibleModelHistoryManufacturerKeys
                              }
                              setVisibleModelHistoryManufacturerKeys={
                                state.setVisibleModelHistoryManufacturerKeys
                              }
                              availableModelHistoryYearOptions={
                                state.availableModelHistoryYearOptions
                              }
                              resolvedVisibleModelHistoryYearKeys={
                                state.resolvedVisibleModelHistoryYearKeys
                              }
                              setVisibleModelHistoryYearKeys={
                                state.setVisibleModelHistoryYearKeys
                              }
                              availableModelHistoryConditionOptions={
                                state.availableModelHistoryConditionOptions
                              }
                              resolvedVisibleModelHistoryConditionKeys={
                                state.resolvedVisibleModelHistoryConditionKeys
                              }
                              setVisibleModelHistoryConditionKeys={
                                state.setVisibleModelHistoryConditionKeys
                              }
                              availableModelHistoryCategoryOptions={
                                state.availableModelHistoryCategoryOptions
                              }
                              resolvedVisibleModelHistoryCategoryKeys={
                                state.resolvedVisibleModelHistoryCategoryKeys
                              }
                              setVisibleModelHistoryCategoryKeys={
                                state.setVisibleModelHistoryCategoryKeys
                              }
                              modelHistoryError={state.modelHistoryError}
                              selectedModelHistoryChartData={
                                state.selectedModelHistoryChartData
                              }
                              isModelHistoryLoading={state.isModelHistoryLoading}
                              filteredSelectedModelHistoryCount={
                                state.filteredSelectedModelHistoryCount
                              }
                              selectedModelHistoryChartConfig={
                                state.selectedModelHistoryChartConfig
                              }
                              selectedModelHistorySeries={state.selectedModelHistorySeries}
                              pendingModelHistoryKeys={state.pendingModelHistoryKeys}
                              formatCurrency={state.formatCurrency}
                              abbreviateCurrency={state.abbreviateCurrency}
                            />
                          }
                        />
                      }
                    />
                  ) : null
                }
                detailsError={state.detailsError}
                detailsForm={state.detailsForm}
                setDetailsForm={state.setDetailsForm}
                availableLocations={state.availableLocations}
                setCustomLocations={state.setCustomLocations}
                mergeUniqueOptions={state.mergeUniqueOptions}
                updateStatusMutation={state.updateStatusMutation}
                handleStatusChange={state.handleStatusChange}
                mediaSection={
                  state.selectedInventoryItemId === liveItem.id ? (
                    <GearMediaSection
                      key={liveItem.id}
                      item={liveItem}
                      onAssetCreated={state.handleMediaAssetCreated}
                      onAssetDeleted={state.handleMediaAssetDeleted}
                    />
                  ) : null
                }
                serviceLogSection={
                  state.isCreatingInline &&
                  state.selectedInventoryItemId === liveItem.id ? null : (
                    <GearServiceLogSection
                      item={liveItem}
                      serviceLogError={state.serviceLogError}
                      isServiceLogEditorOpen={state.isServiceLogEditorOpen}
                      serviceLogForm={state.serviceLogForm}
                      setServiceLogForm={state.setServiceLogForm}
                      canAddServiceLog={state.canAddServiceLog}
                      isEditingServiceLog={state.isEditingServiceLog}
                      addServiceLogMutation={state.addServiceLogMutation}
                      updateServiceLogMutation={state.updateServiceLogMutation}
                      deleteServiceLogMutation={state.deleteServiceLogMutation}
                      handleSaveServiceLog={state.handleSaveServiceLog}
                      resetServiceLogEditor={state.resetServiceLogEditor}
                      openNewServiceLogEditor={state.openNewServiceLogEditor}
                      openEditServiceLogEditor={state.openEditServiceLogEditor}
                    />
                  )
                }
                isDetailsDirty={state.isDetailsDirty}
                isEditorDirty={state.isEditorDirty}
                isFormComplete={state.isFormComplete}
                isSavingDetails={state.isSavingInlineDetails}
                handleSaveDetails={state.handleSaveDetails}
                resetDetails={state.resetInlineEditState}
              />
            )}}
          />
        }
      />

      <WishlistGearSection
        items={wishlistState.items}
        loadError={wishlistLoadError}
        isCreatingInline={wishlistState.isCreatingInline}
        openNewRow={wishlistState.openNewRow}
        summary={wishlistState.wishlistSummary}
        valueDistributionChartData={wishlistState.wishlistValueDistributionChartData}
        manufacturerRadialChartData={wishlistState.wishlistManufacturerRadialChartData}
        valueChartConfig={wishlistState.wishlistValueChartConfig}
        spendOverTimeChartData={wishlistState.wishlistSpendOverTimeChartData}
        spendTimelineChartConfig={wishlistState.wishlistSpendTimelineChartConfig}
        spendByGroupAreaChart={wishlistState.wishlistSpendByGroupAreaChart}
        formatCurrency={wishlistState.formatCurrency}
        abbreviateCurrency={wishlistState.abbreviateCurrency}
        columns={wishlistState.columns}
        selectedItemId={wishlistState.selectedItemId}
        handleSelectRow={wishlistState.handleSelectRow}
        filterTabs={wishlistState.filterTabs}
        renderExpandedRow={(item) => (
          <WishlistGearInventoryDetailsPanel
            item={item}
            detailsForm={wishlistState.detailsForm}
            setDetailsForm={wishlistState.setDetailsForm}
            detailsError={wishlistState.detailsError}
            isDetailsDirty={wishlistState.isDetailsDirty}
            isEditorDirty={wishlistState.isEditorDirty}
            isFormComplete={wishlistState.isFormComplete}
            isSavingDetails={wishlistState.isSavingInlineDetails}
            isPromoting={wishlistState.isPromoting}
            updateStatusMutation={wishlistState.updateWishlistStatusMutation}
            handleStatusChange={wishlistState.handleStatusChange}
            handleSaveDetails={wishlistState.handleSaveDetails}
            handlePromote={wishlistState.handlePromote}
            resetDetails={wishlistState.resetInlineEditState}
            editorSection={
              wishlistState.isCreatingInline || wishlistState.form.id === item.id ? (
                <GearEditorForm
                  idPrefix={`wishlist-inline-${item.id}`}
                  isEditing
                  form={wishlistState.form}
                  setForm={wishlistState.setForm}
                  error={wishlistState.error}
                  handleSubmit={wishlistState.handleSubmit}
                  handleClearForm={wishlistState.handleClearForm}
                  isFormComplete={wishlistState.isFormComplete}
                  upsertMutation={wishlistState.upsertWishlistMutation}
                  availableManufacturerGroups={
                    wishlistState.availableManufacturerGroups
                  }
                  availableGearTypes={wishlistState.availableGearTypes}
                  availableGearGroups={wishlistState.availableGearGroups}
                  setCustomManufacturers={wishlistState.setCustomManufacturers}
                  setCustomGearTypes={wishlistState.setCustomGearTypes}
                  setCustomGearGroups={wishlistState.setCustomGearGroups}
                  mergeUniqueOptions={wishlistState.mergeUniqueOptions}
                  handleNumberInputWheel={wishlistState.handleNumberInputWheel}
                  showActions={false}
                  priceLabel="Target Price (USD)"
                  quantityLabel="Desired Quantity"
                  pricingSection={
                    <GearPricingSection
                      pricingError={wishlistState.pricingError}
                      priceGuideMatches={wishlistState.priceGuideMatches}
                      priceGuideColumns={wishlistState.priceGuideColumns}
                      priceGuideTableResetKey={wishlistState.priceGuideTableResetKey}
                      priceGuideFilterTabs={wishlistState.priceGuideFilterTabs}
                      selectedPriceGuideIds={wishlistState.selectedPriceGuideIds}
                      selectedPriceGuideCount={wishlistState.selectedPriceGuideCount}
                      selectedAveragePrice={wishlistState.selectedAveragePrice}
                      handleApplyAveragePrice={
                        wishlistState.handleApplyAveragePrice
                      }
                      handleTogglePriceGuide={wishlistState.handleTogglePriceGuide}
                      formatCurrency={wishlistState.formatCurrency}
                      historySection={
                        <GearSelectedTitleHistorySection
                          selectedTitleQueries={wishlistState.selectedTitleQueries}
                          availableModelHistorySourceOptions={
                            wishlistState.availableModelHistorySourceOptions
                          }
                          resolvedVisibleModelHistorySources={
                            wishlistState.resolvedVisibleModelHistorySources
                          }
                          setVisibleModelHistorySources={
                            wishlistState.setVisibleModelHistorySources
                          }
                          availableModelHistoryTitleOptions={
                            wishlistState.availableModelHistoryTitleOptions
                          }
                          resolvedVisibleModelHistoryTitleKeys={
                            wishlistState.resolvedVisibleModelHistoryTitleKeys
                          }
                          setVisibleModelHistoryTitleKeys={
                            wishlistState.setVisibleModelHistoryTitleKeys
                          }
                          availableModelHistorySeriesOptions={
                            wishlistState.availableModelHistorySeriesOptions
                          }
                          resolvedVisibleModelHistoryModelKeys={
                            wishlistState.resolvedVisibleModelHistoryModelKeys
                          }
                          setVisibleModelHistoryModelKeys={
                            wishlistState.setVisibleModelHistoryModelKeys
                          }
                          availableModelHistoryManufacturerOptions={
                            wishlistState.availableModelHistoryManufacturerOptions
                          }
                          resolvedVisibleModelHistoryManufacturerKeys={
                            wishlistState.resolvedVisibleModelHistoryManufacturerKeys
                          }
                          setVisibleModelHistoryManufacturerKeys={
                            wishlistState.setVisibleModelHistoryManufacturerKeys
                          }
                          availableModelHistoryYearOptions={
                            wishlistState.availableModelHistoryYearOptions
                          }
                          resolvedVisibleModelHistoryYearKeys={
                            wishlistState.resolvedVisibleModelHistoryYearKeys
                          }
                          setVisibleModelHistoryYearKeys={
                            wishlistState.setVisibleModelHistoryYearKeys
                          }
                          availableModelHistoryConditionOptions={
                            wishlistState.availableModelHistoryConditionOptions
                          }
                          resolvedVisibleModelHistoryConditionKeys={
                            wishlistState.resolvedVisibleModelHistoryConditionKeys
                          }
                          setVisibleModelHistoryConditionKeys={
                            wishlistState.setVisibleModelHistoryConditionKeys
                          }
                          availableModelHistoryCategoryOptions={
                            wishlistState.availableModelHistoryCategoryOptions
                          }
                          resolvedVisibleModelHistoryCategoryKeys={
                            wishlistState.resolvedVisibleModelHistoryCategoryKeys
                          }
                          setVisibleModelHistoryCategoryKeys={
                            wishlistState.setVisibleModelHistoryCategoryKeys
                          }
                          modelHistoryError={wishlistState.modelHistoryError}
                          selectedModelHistoryChartData={
                            wishlistState.selectedModelHistoryChartData
                          }
                          isModelHistoryLoading={wishlistState.isModelHistoryLoading}
                          filteredSelectedModelHistoryCount={
                            wishlistState.filteredSelectedModelHistoryCount
                          }
                          selectedModelHistoryChartConfig={
                            wishlistState.selectedModelHistoryChartConfig
                          }
                          selectedModelHistorySeries={
                            wishlistState.selectedModelHistorySeries
                          }
                          pendingModelHistoryKeys={
                            wishlistState.pendingModelHistoryKeys
                          }
                          formatCurrency={wishlistState.formatCurrency}
                          abbreviateCurrency={wishlistState.abbreviateCurrency}
                        />
                      }
                    />
                  }
                />
              ) : null
            }
          />
        )}
      />

      <GearTaxonomySection state={state.taxonomyState} />
    </Accordion>
  );
}
