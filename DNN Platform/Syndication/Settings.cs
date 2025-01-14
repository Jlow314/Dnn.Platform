﻿// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
// See the LICENSE file in the project root for more information
namespace DotNetNuke.Services.Syndication
{
    using System.Diagnostics.CodeAnalysis;

    /// <summary>Holder of settings values.</summary>
    internal static class Settings
    {
        /// <summary>The path to the root of the cache folder.</summary>
        [SuppressMessage("StyleCop.CSharp.MaintainabilityRules", "SA1401:FieldsMustBePrivate", Justification = "Breaking change")]
        internal static string CacheRoot = "Portals/_default/Cache";
    }
}
