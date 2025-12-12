# Custom Charts - ThoughtSpot Documentation

**Fonte:** https://docs.thoughtspot.com/cloud/10.14.0.cl/chart-custom

---

- [Cloud](index.html)
- [Charts](charts.html)
- [Custom charts](chart-custom.html)

10.14.0.cl

# Custom charts 

Custom charts give you the ability to create chart types to visualize
your data, by using any charting library created outside of ThoughtSpot.
You can also access ready-to-use charts created by partners. Custom
charts are compatible with native ThoughtSpot features like drill down,

This article describes how you use a custom chart and how your
ThoughtSpot administrator can add, edit, and delete custom charts.

Options for custom charts:

- Access a library of custom charts that can be installed in seconds,
  with our partner Vitara. Vitara requires a separate subscription. For
  ThoughtSpot](chart-vitara.html).

- Use Muse Studio to create your own charts in ThoughtSpot. For more
  Studio](chart-create.html).

- Developers can create custom charts in Javascript using charting
  [Highcharts](https://www.highcharts.com/). For more information, refer to the [ThoughtSpot
  Charts SDK
  documentation](https://github.com/thoughtspot/ts-chart-sdk/blob/main/README.md/).

- ThoughtSpot professional services can create custom charts for you.
  For more information, contact [ThoughtSpot
  support](https://community.thoughtspot.com/customers/s/contactsupport).

To enable the custom charts feature, contact your administrator.

## [](#_using_custom_charts)Using custom charts 

To use a custom chart, do the following:

1.  Click the **Change visualization** button [![chart

2.  Below the list of default charts, select a custom chart.

    ![Select custom chart](_images/custom-chart-select.png)

## [](#_administering_custom_charts)Administering custom charts 

A ThoughtSpot administrator can add custom charts to your cluster, as
well as edit and delete them. Before adding custom charts, the
administrator must add the domains where the custom chart and chart icon
are hosted to the list of permitted iFrame and CSP img-src domains in
ThoughtSpot. Without performing this step, the custom chart cannot be

### [](#_adding_domains_to_the_permitted_iframe_and_csp_img_src_domains)Adding domains to the permitted iFrame and CSP img-src domains 

The ThoughtSpot administrator must enter the domain for both the chart

To add the domain for a custom chart and chart icon, do the following:

1.  Select **Develop** from the navigation bar.

2.  Navigate to **All Orgs** \> **Security settings**.

3.  Click **Edit**.

4.  In the **Permitted iFrame domains** field enter the domain where the

5.  In the **CSP img-src domains** field enter the domain where the

6.  Click **Save Changes**.

### [](#_adding_a_custom_chart_to_a_thoughtspot_cluster)Adding a custom chart to a ThoughtSpot cluster 

To add a custom chart, the ThoughtSpot administrator does the following:

1.  Select **Admin** in the top navigation bar.

2.  Select **All Orgs**

3.  Under *Application settings*, Select **Chart customization**.

4.  Select the **Custom charts** tab.

5.  Click **Add chart**

    The Add custom chart window appears.

    ![Add custom chart](_images/chart-custom.png)

6.  Enter the following fields:

    - Name

    - Description (optional)

    - Application URL

    - Icon URL (optional)

    - Author name (optional)

    - Author email (optional)

    - Author organization (optional)

7.  Click **Add chart**.

    Your new chart appears on the *Custom charts* page, and is now
    available for use when creating a chart in ThoughtSpot.

### [](#_editing_a_custom_chart)Editing a custom chart 

To edit a custom chart, the ThoughtSpot administrator does the
following:

1.  Select **Admin** in the top navigation bar.

2.  Under *Application settings*, Select **Chart customization**.

3.  Select the **Custom charts** tab.

4.  Find the name of the chart you want to change, and click **Edit**.

5.  In the *Update custom chart* window, make any changes necessary,

### [](#_deleting_a_custom_chart)Deleting a custom chart 

To delete a custom chart, the ThoughtSpot administrator does the
following:

1.  Select **Admin** in the top navigation bar.

2.  Under *Application settings*, Select **Chart customization**.

3.  Select the **Custom charts** tab.

4.  Find the name of the chart you want to delete, and click **Delete**.

5.  In the *Delete custom chart* warning message which appears, click
    **Delete**.

------------------------------------------------------------------------

Was this page helpful?[Give us feedback!](#modal-1)
