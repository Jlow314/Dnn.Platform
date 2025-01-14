﻿// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
// See the LICENSE file in the project root for more information

// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
// See the LICENSE file in the project root for more information
namespace Dnn.PersonaBar.Library.Prompt.Models
{
    using System;

    using Newtonsoft.Json;

    [Obsolete("Moved to DotNetNuke.Prompt in the core library project. Will be removed in DNN 11.", false)]
    public class PagingInfo
    {
        [JsonProperty(PropertyName = "pageNo")]
        public int PageNo { get; set; }

        [JsonProperty(PropertyName = "pageSize")]
        public int PageSize { get; set; }

        [JsonProperty(PropertyName = "totalPages")]
        public int TotalPages { get; set; }
    }
}
