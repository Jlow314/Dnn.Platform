﻿// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
// See the LICENSE file in the project root for more information

namespace Dnn.Modules.TelerikRemovalLibrary
{
    using System;
    using System.Collections.Generic;

    using DotNetNuke.Common.Utilities;

    /// <inheritdoc />
    internal class TelerikUninstaller : ITelerikUninstaller
    {
        private readonly IServiceProvider serviceProvider;
        private readonly List<UninstallSummaryItem> progress;

        /// <summary>
        /// Initializes a new instance of the <see cref="TelerikUninstaller"/> class.
        /// </summary>
        /// <param name="serviceProvider">An instance of <see cref="IServiceProvider"/>.</param>
        public TelerikUninstaller(IServiceProvider serviceProvider)
        {
            this.serviceProvider = serviceProvider ??
                throw new ArgumentNullException(nameof(serviceProvider));

            this.progress = new List<UninstallSummaryItem>();
        }

        /// <inheritdoc/>
        public IEnumerable<UninstallSummaryItem> Progress => this.progress;

        /// <inheritdoc/>
        public void Execute()
        {
            var steps = new[]
            {
                this.InstallAvailableExtension(
                    "ResourceManager",
                    "DNNCE_ResourceManager_09.*_Install.resources",
                    "Module"),
                this.ReplaceModuleInPage("File Management", "Digital Asset Management", "ResourceManager"),
                this.ReplaceModuleInHostPage("File Management", "Digital Asset Management", "ResourceManager"),
                this.RemoveExtension("DigitalAssetsManagement"),
                this.RemoveExtension("DotNetNuke.Telerik.Web"),
                this.RemoveExtension("DotNetNuke.Web.Deprecated"),
                this.RemoveExtension("DotNetNuke.Website.Deprecated"),
                this.RemoveExtension("Admin.Messaging"),
                this.RemoveExtension("DNNSecurityHotFix20171"),
                this.RemoveExtension("DotNetNuke.RadEditorProvider"),
                this.UpdateDataTypeList("Date"),
                this.UpdateDataTypeList("DateTime"),
                this.UpdateSiteUrlsConfig(),
                this.UpdateWebConfig(),
                this.RemoveUninstalledExtensionFiles("Library_DotNetNuke.Telerik_*"),
                this.RemoveUninstalledExtensionFiles("Library_DotNetNuke.Web.Deprecated_*"),
                this.RemoveUninstalledExtensionFiles("Library_DotNetNuke.Website.Deprecated_*"),
                this.RemoveUninstalledExtensionFiles("DNNSecurityHotFix*"),
            };

            var skip = false;

            foreach (var step in steps)
            {
                if (!skip)
                {
                    step.Execute();

                    var nullable = step.Success;
                    if (nullable.HasValue && nullable.Value == false)
                    {
                        skip = true;
                    }
                }

                this.progress.AddRange(UninstallSummaryItem.FromStep(step));
            }
        }

        private IStep InstallAvailableExtension(string packageName, string fileNamePattern, string packageType)
        {
            var step = this.GetService<IInstallAvailablePackageStep>();
            step.PackageFileNamePattern = fileNamePattern;
            step.PackageName = packageName;
            step.PackageType = packageType;
            return step;
        }

        private IStep ReplaceModuleInPage(string pageName, string oldModuleName, string newModuleName)
        {
            var step = this.GetService<IReplaceTabModuleStep>();
            step.PageName = pageName;
            step.OldModuleName = oldModuleName;
            step.NewModuleName = newModuleName;
            return step;
        }

        private IStep ReplaceModuleInHostPage(string pageName, string oldModuleName, string newModuleName)
        {
            var parentStep = this.GetService<IReplaceTabModuleStep>();
            parentStep.PageName = pageName;
            parentStep.OldModuleName = oldModuleName;
            parentStep.NewModuleName = newModuleName;

            var step = this.GetService<IReplacePortalTabModuleStep>();
            step.ParentStep = parentStep;
            step.PortalId = Null.NullInteger;

            return step;
        }

        private IStep RemoveExtension(string packageName)
        {
            var step = this.GetService<IRemoveExtensionStep>();
            step.PackageName = packageName;
            return step;
        }

        private IStep UpdateDataTypeList(string value)
        {
            var commandFormat = string.Join(
                Environment.NewLine,
                "UPDATE {{databaseOwner}}[{{objectQualifier}}Lists]",
                "SET Text = 'DotNetNuke.Web.UI.WebControls.Internal.PropertyEditorControls.{0}EditControl, DotNetNuke.Web'",
                "WHERE ListName = 'DataType' AND Value = '{0}'");

            var step = this.GetService<IExecuteSqlStep>();
            step.Name = $"Update provider for '{value}' in DataType list";
            step.CommandText = string.Format(commandFormat, value);
            return step;
        }

        private IStep UpdateSiteUrlsConfig()
        {
            return this.NullStep("Remove all Telerik rewrite rules from the SiteUrls.config file");
        }

        private IStep UpdateWebConfig()
        {
            return this.NullStep("Remove all Telerik references from the Web.config file");
        }

        private IStep RemoveUninstalledExtensionFiles(string packageName)
        {
            return this.NullStep($"Remove extension files '{packageName}'");
        }

        private IStep NullStep(string name)
        {
            var step = this.GetService<INullStep>();
            step.Name = name;
            return step;
        }

        private T GetService<T>()
            where T : class
        {
            return (T)this.serviceProvider.GetService(typeof(T));
        }
    }
}
